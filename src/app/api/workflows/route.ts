import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { SYSTEM_WORKFLOW_IDS } from "@/config/systemWorkflows";
import { DEFAULT_INITIAL_NODES } from "@/config/defaults";
import { Prisma } from "../../../../generated/prisma/client";
import { GoogleGenAI } from "@google/genai";
import {
  geminiWorkflowToolDeclarations,
  executeWorkflowTool,
  type ToolExecutionContext,
} from "@/lib/workflow-tools";
import type { Node, Edge } from "@xyflow/react";

const CreateWorkflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  prompt: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await db.workflow.findMany({
      where: {
        userId: user.id,
        NOT: {
          id: {
            in: SYSTEM_WORKFLOW_IDS.map((sysId) => `${user.id}-${sysId}`),
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
        createdAt: true,
        backgroundImage: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("GET /api/workflows error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch workflows";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch {}

    const result = CreateWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: result.error.format() },
        { status: 400 },
      );
    }

    const { name, description, prompt } = result.data;
    const userPrompt = prompt?.trim();

    // 1. Create base workflow record
    let workflow = await db.workflow.create({
      data: {
        userId: user.id,
        name: name || (userPrompt ? "Generating Workflow..." : "Untitled Workflow"),
        description: description || null,
        nodes: DEFAULT_INITIAL_NODES as unknown as Prisma.InputJsonValue,
        edges: [],
      },
    });

    // 2. If user provided a natural language prompt, build workflow using Gemini & save chat history
    if (userPrompt) {
      try {
        // Save initial user message
        await db.workflowMessage.create({
          data: {
            workflowId: workflow.id,
            userId: user.id,
            role: "user",
            content: userPrompt,
          },
        });

        const apiKey =
          process.env.GEMINI_API_KEY || process.env.GEMINI_SECRET_KEY || "";

        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });

          const toolContext: ToolExecutionContext = {
            workflowId: workflow.id,
            userId: user.id,
            workflow: workflow as unknown as ToolExecutionContext["workflow"],
            currentNodes: DEFAULT_INITIAL_NODES,
            currentEdges: [],
            mediaFiles: [],
          };

          const systemInstruction = `
You are the AI workflow architect for NextFlow.
Your job is to build a visual, executable automation graph based on the user's description.

CRITICAL INSTRUCTION:
You MUST ALWAYS call the tool "create_or_update_workflow" to construct the graph. Include a descriptive "name", "description", full "nodes" array, and connecting "edges" array.

NODE TYPES AND HANDLE SPECIFICATION:
1. "requestInput" (id: "request_inputs", position: {x: 80, y: 180}, deletable: false)
   - data.fields: array of { id: "text_field" | "image_field" | "audio_field", type: "text_field" | "image_field" | "audio_field", label: string, value: "" }
   - Output handles: match each field's id (e.g. "text_field", "image_field", "audio_field")

2. "textNode" (id: "textNode_1", position: {x: 480, y: 150})
   - data: { model: "gemini-2.5-flash-lite", prompt: string, systemPrompt: string, temperature: 0.7, topP: 0.95, maxTokens: 2048 }
   - Input handles: "prompt", "systemPrompt", "image_input"
   - Output handle: "response"

3. "cropImage" (id: "cropImage_1", position: {x: 480, y: 220})
   - data: { inputImage: "", x: 0, y: 0, width: 100, height: 100, outputImage: "" }
   - Input handles: "inputImage", "x", "y", "width", "height"
   - Output handle: "outputImage"

4. "response" (id: "response", position: {x: 920, y: 180}, deletable: false)
   - data: { results: [] }
   - Input handle: "result"

EDGE CONNECTIONS:
- Connect output handles from requestInput to the input handles of textNode/cropImage.
- Connect the output handle ("response" or "outputImage") of textNode/cropImage to the "result" handle of the "response" node.
`;

          const userMessageContent = `Please build a complete, connected workflow for the following request: "${userPrompt}".
Call create_or_update_workflow with the complete nodes, edges, workflow name, and workflow description.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                role: "user",
                parts: [{ text: userMessageContent }],
              },
            ],
            config: {
              systemInstruction,
              tools: geminiWorkflowToolDeclarations,
              temperature: 0.1,
            },
          });

          const functionCalls = response.functionCalls || [];
          const executedToolResults = [];

          if (functionCalls.length > 0) {
            for (const call of functionCalls) {
              if (call.name) {
                const toolArgs = (call.args || {}) as Record<string, unknown>;
                const result = await executeWorkflowTool(call.name, toolArgs, toolContext);
                executedToolResults.push(result);
              }
            }
          }

          let assistantReply = response.text || "";
          if (!assistantReply) {
            assistantReply = executedToolResults
              .map((r) => r.message || (r.success ? "Workflow generated successfully." : ""))
              .filter(Boolean)
              .join(" ");
          }

          if (!assistantReply) {
            assistantReply = "I've generated the workflow graph and configured the nodes for you.";
          }

          // Save assistant response message in DB
          await db.workflowMessage.create({
            data: {
              workflowId: workflow.id,
              userId: user.id,
              role: "assistant",
              content: assistantReply,
            },
          });

          // Reload updated workflow
          const updatedWorkflow = await db.workflow.findUnique({
            where: { id: workflow.id },
          });
          if (updatedWorkflow) {
            workflow = updatedWorkflow;
          }
        }
      } catch (genError) {
        console.error("AI workflow generation during creation failed:", genError);
        // Fallback: Ensure default workflow name isn't stuck on "Generating..."
        if (workflow.name === "Generating Workflow...") {
          workflow = await db.workflow.update({
            where: { id: workflow.id },
            data: { name: "Untitled Workflow" },
          });
        }
      }
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("POST /api/workflows error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create workflow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
