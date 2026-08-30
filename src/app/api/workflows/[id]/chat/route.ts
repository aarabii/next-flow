import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import {
  geminiWorkflowToolDeclarations,
  executeWorkflowTool,
  type MediaFileAttachment,
  type ToolExecutionContext,
  type ToolResult,
} from "@/lib/workflow-tools";
import type { Node, Edge } from "@xyflow/react";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

interface ChatRequestBody {
  message: string;
  mediaFiles?: MediaFileAttachment[];
  currentNodes?: Node[];
  currentEdges?: Edge[];
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workflowId } = await params;

    const workflow = await db.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    const messages = await db.workflowMessage.findMany({
      where: {
        workflowId,
        userId: user.id,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/workflows/[id]/chat error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 20 messages per minute per user
    const isAllowed = await limiter.check(20, `chat_${user.id}`);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before sending another message." },
        { status: 429 },
      );
    }

    const { id: workflowId } = await params;
    const body: ChatRequestBody = await req.json();

    if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 },
      );
    }

    const userPrompt = body.message.trim();
    const mediaFiles = Array.isArray(body.mediaFiles) ? body.mediaFiles : [];

    const workflow = await db.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        nodes: true,
        edges: true,
        userId: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    // Save user message in DB
    await db.workflowMessage.create({
      data: {
        workflowId,
        userId: user.id,
        role: "user",
        content: userPrompt,
      },
    });

    // Fetch conversation history (latest 10 messages)
    const recentMessages = await db.workflowMessage.findMany({
      where: {
        workflowId,
        userId: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        role: true,
        content: true,
      },
    });
    recentMessages.reverse();

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GEMINI_SECRET_KEY || "";
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured");
    }

    const ai = new GoogleGenAI({ apiKey });

    const currentNodes =
      (body.currentNodes as Node[]) ||
      (workflow.nodes as unknown as Node[]) ||
      [];
    const currentEdges =
      (body.currentEdges as Edge[]) ||
      (workflow.edges as unknown as Edge[]) ||
      [];

    const toolContext: ToolExecutionContext = {
      workflowId,
      userId: user.id,
      workflow: workflow as unknown as ToolExecutionContext["workflow"],
      currentNodes,
      currentEdges,
      mediaFiles,
    };

    const systemInstruction = `
You are the AI workflow copilot and builder for NextFlow.
You have tools to create/modify workflows, execute workflows or individual nodes, attach uploaded media to nodes, and set the workflow card background.

PRIMARY DIRECTIVES:
1. ONLY assist with visual workflow orchestration, automation graph generation, parameter adjustments, execution, and media attachments.
2. GUARDRAIL: If the user asks about an unrelated topic (e.g. general trivia, coding unconnected to the workflow, recipes), politely decline and tell the user you are dedicated to NextFlow workflow engineering. DO NOT call tools for unrelated requests.
3. AVAILABLE TOOLS:
   - "create_or_update_workflow": Use when user wants to create a new workflow or change/add/remove nodes and edges.
   - "run_workflow": Use when user says "run this workflow", "test workflow", "run crop node", etc. Scope can be "FULL", "SINGLE", or "PARTIAL".
   - "attach_media_to_node": Use when the user wants to attach an image, audio, or video URL to a node (like cropImage, textNode, or requestInput).
   - "set_workflow_background": Use when the user asks to change or set the background image of this workflow card.
   - "generate_workflow_name": Use when the user asks to generate a name, title, or description for the workflow.
4. NODE TYPES SPEC:
   - "requestInput" (id: "request_inputs", position: {x: 100, y: 200}, deletable: false, data: { fields: [{ id, type: "text_field" | "image_field" | "audio_field" | "video_field", label, value }] })
   - "textNode" (id: "textNode_<id>", position: {x: 500, y: 150}, data: { model: "gemini-2.5-flash-lite", prompt, systemPrompt, temperature: 0.7, topP: 0.95, maxTokens: 2048 })
   - "cropImage" (id: "cropImage_<id>", position: {x: 500, y: 250}, data: { inputImage, x: 0, y: 0, width: 100, height: 100, outputImage: "" })
   - "response" (id: "response", position: {x: 950, y: 200}, deletable: false, data: { results: [] })
5. Always produce clear, concise explanations when invoking tools or responding to the user.
`;

    // Clean nodes to strip heavy unnecessary UI-internal properties
    const cleanNodes = currentNodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    }));

    const cleanEdges = currentEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
    }));

    const contextPayload = {
      userRequest: userPrompt,
      attachedMediaFiles: mediaFiles,
      currentWorkflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        nodeCount: cleanNodes.length,
        nodes: cleanNodes,
        edges: cleanEdges,
      },
      recentChatHistory: recentMessages,
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: JSON.stringify(contextPayload) }],
        },
      ],
      config: {
        systemInstruction,
        tools: geminiWorkflowToolDeclarations,
        temperature: 0.2,
      },
    });

    let assistantReply = response.text || "";
    let finalNodes: Node[] | null = null;
    let finalEdges: Edge[] | null = null;
    let runId: string | null = null;
    let backgroundImage: string | null = null;
    let generatedName: string | null = null;
    const executedToolResults: ToolResult[] = [];

    // Check for tool function calls
    const functionCalls = response.functionCalls || [];

    if (functionCalls.length > 0) {
      for (const call of functionCalls) {
        const toolName = call.name;
        if (!toolName) continue;
        const toolArgs = (call.args || {}) as Record<string, unknown>;

        const result = await executeWorkflowTool(toolName, toolArgs, toolContext);
        executedToolResults.push(result);

        if (result.nodes) {
          finalNodes = result.nodes;
          toolContext.currentNodes = result.nodes;
        }
        if (result.edges) {
          finalEdges = result.edges;
          toolContext.currentEdges = result.edges;
        }
        if (result.runId) {
          runId = result.runId;
        }
        if (result.backgroundImage) {
          backgroundImage = result.backgroundImage;
        }
        if (result.name) {
          generatedName = result.name;
        }
      }

      if (!assistantReply) {
        assistantReply = executedToolResults
          .map((r) => r.message || (r.success ? "Action completed." : "Action failed."))
          .join(" ");
      }
    }

    if (!assistantReply) {
      assistantReply = "Processed your request.";
    }

    // Save assistant response message in DB
    const assistantMessageRecord = await db.workflowMessage.create({
      data: {
        workflowId,
        userId: user.id,
        role: "assistant",
        content: assistantReply,
      },
    });

    return NextResponse.json({
      message: assistantMessageRecord,
      reply: assistantReply,
      nodes: finalNodes,
      edges: finalEdges,
      runId,
      name: generatedName,
      backgroundImage,
      toolResults: executedToolResults,
    });
  } catch (error) {
    console.error("POST /api/workflows/[id]/chat error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process workflow chat request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
