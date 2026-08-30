import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "../../../../../generated/prisma/client";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import type { Node, Edge } from "@xyflow/react";
import type { CSSProperties } from "react";

const ImportWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nodes: z.array(z.unknown()).nonempty("Nodes list is required"),
  edges: z.array(z.unknown()).optional().default([]),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const result = ImportWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: result.error.format() },
        { status: 400 },
      );
    }

    const { name, nodes: rawNodes, edges: rawEdges } = result.data;

    let generationCount = 0;
    const cleanNodes: Node[] = [];
    const validNodeIds = new Set<string>();
    const idMap = new Map<string, string>();

    for (const rawNode of rawNodes) {
      if (!rawNode || typeof rawNode !== "object") continue;
      const node = rawNode as Record<string, unknown>;

      const type = node.type;
      if (!type || typeof type !== "string") continue;
      if (!["requestInput", "response", "textNode", "cropImage"].includes(type)) continue;

      const rawId = node.id;
      const id = typeof rawId === "string" && rawId
        ? rawId
        : `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Check for duplicate node ID in input, and append a suffix if duplicate
      let finalId = id;
      let counter = 1;
      while (validNodeIds.has(finalId)) {
        finalId = `${id}_dup${counter}`;
        counter++;
      }
      validNodeIds.add(finalId);

      // Keep mapping of old ID to new ID
      const oldId = typeof node.id === "string" && node.id ? node.id : finalId;
      idMap.set(oldId, finalId);

      // Handle Position
      const rawPosition = node.position as Record<string, unknown> | undefined;
      let position: { x: number; y: number };
      if (!rawPosition || typeof rawPosition.x !== "number" || typeof rawPosition.y !== "number") {
        if (type === "requestInput") {
          position = { x: 50, y: 150 };
        } else if (type === "response") {
          position = { x: 950, y: 250 };
        } else {
          position = {
            x: 350 + (generationCount % 2) * 280,
            y: 150 + Math.floor(generationCount / 2) * 220,
          };
          generationCount++;
        }
      } else {
        position = { x: rawPosition.x, y: rawPosition.y };
      }

      // Handle Data (clean transit status/fields)
      const data: Record<string, unknown> = {};
      const rawData = (node.data || {}) as Record<string, unknown>;

      if (type === "requestInput") {
        data.fields = Array.isArray(rawData.fields) ? rawData.fields.map((f: unknown) => {
          const field = (f && typeof f === "object" ? f : {}) as Record<string, unknown>;
          return {
            id: typeof field.id === "string" ? field.id : `field_${Math.random().toString(36).substring(2, 9)}`,
            type: field.type === "image_field" ? "image_field" : "text_field",
            label: typeof field.label === "string" ? field.label : "Field Label",
            value: "", // Clear value for security & stability
          };
        }) : [
          { id: "text_field", type: "text_field", label: "Text Field", value: "" },
          { id: "image_field", type: "image_field", label: "Image Field", value: "" },
        ];
      } else if (type === "response") {
        data.results = [];
      } else if (type === "textNode") {
        const config = GEMINI_MODEL_CONFIG.textNode;
        data.model = typeof rawData.model === "string" ? rawData.model : config.defaultModelId;
        data.temperature = rawData.temperature !== undefined ? Number(rawData.temperature) : config.defaultTemperature;
        data.topP = rawData.topP !== undefined ? Number(rawData.topP) : config.defaultTopP;
        data.maxTokens = rawData.maxTokens !== undefined ? Number(rawData.maxTokens) : config.defaultMaxTokens;
        data.systemPrompt = typeof rawData.systemPrompt === "string" ? rawData.systemPrompt : "You are a helpful text generator assistant. Provide concise and accurate text responses.";
        
        // Clear transient outputs
        data.response = "";
        data.imageInput = "";
        data.imageInputFileName = "";
      } else if (type === "cropImage") {
        data.x = rawData.x !== undefined ? Number(rawData.x) : 0;
        data.y = rawData.y !== undefined ? Number(rawData.y) : 0;
        data.width = rawData.width !== undefined ? Number(rawData.width) : 100;
        data.height = rawData.height !== undefined ? Number(rawData.height) : 100;
        
        // Clear transient outputs
        data.inputImage = "";
        data.outputImage = "";
      }

      cleanNodes.push({
        id: finalId,
        type,
        position,
        data,
        deletable: !["requestInput", "response"].includes(type),
      });
    }

    const cleanEdges: Edge[] = [];
    for (const rawEdge of rawEdges) {
      if (!rawEdge || typeof rawEdge !== "object") continue;
      const edge = rawEdge as Record<string, unknown>;

      const source = edge.source;
      const target = edge.target;
      if (!source || !target || typeof source !== "string" || typeof target !== "string") continue;

      // Map to new IDs (in case we renamed them or resolved duplicate suffixes)
      const mappedSource = idMap.get(source);
      const mappedTarget = idMap.get(target);

      // Verify that both nodes exist in our final nodes list
      if (!mappedSource || !mappedTarget) continue;

      // Re-generate or construct edge id
      const edgeId = typeof edge.id === "string" ? edge.id : `edge_${mappedSource}_${typeof edge.sourceHandle === "string" ? edge.sourceHandle : "default"}_to_${mappedTarget}_${typeof edge.targetHandle === "string" ? edge.targetHandle : "default"}`;

      cleanEdges.push({
        id: edgeId,
        source: mappedSource,
        target: mappedTarget,
        sourceHandle: typeof edge.sourceHandle === "string" ? edge.sourceHandle : undefined,
        targetHandle: typeof edge.targetHandle === "string" ? edge.targetHandle : undefined,
        type: typeof edge.type === "string" ? edge.type : "smoothstep",
        animated: typeof edge.animated === "boolean" ? edge.animated : true,
        style: (edge.style && typeof edge.style === "object" ? edge.style : { stroke: "#a855f7", strokeWidth: 2 }) as CSSProperties,
      });
    }

    const workflow = await db.workflow.create({
      data: {
        userId: user.id,
        name,
        nodes: cleanNodes as unknown as Prisma.InputJsonValue,
        edges: cleanEdges as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("POST /api/workflows/import error:", error);
    const message = error instanceof Error ? error.message : "Failed to import workflow";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
