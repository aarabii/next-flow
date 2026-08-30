import { db } from "@/lib/prisma";
import type { Node, Edge } from "@xyflow/react";
import type { ToolExecutionContext, ToolResult } from "./types";
import { Prisma } from "../../../generated/prisma/client";

export interface CreateWorkflowArgs {
  nodes: Node[];
  edges: Edge[];
  name?: string;
  description?: string;
  summary?: string;
}

export async function executeCreateOrUpdateWorkflow(
  args: CreateWorkflowArgs,
  context: ToolExecutionContext,
): Promise<ToolResult> {
  try {
    const { nodes, edges, name, description, summary } = args;

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return {
        toolName: "create_or_update_workflow",
        success: false,
        message: "No valid nodes provided to update workflow.",
      };
    }

    const updatedEdges = Array.isArray(edges) ? edges : [];

    // Ensure style and type formatting on edges
    const formattedEdges = updatedEdges.map((e) => ({
      ...e,
      id:
        e.id ||
        `edge_${e.source}_${e.sourceHandle || "default"}_to_${e.target}_${e.targetHandle || "default"}`,
      type: e.type || "smoothstep",
      animated: e.animated !== undefined ? e.animated : true,
      style: e.style || { stroke: "#a855f7", strokeWidth: 2 },
    }));

    const updateData: Prisma.WorkflowUpdateInput = {
      nodes: nodes as unknown as Prisma.InputJsonValue,
      edges: formattedEdges as unknown as Prisma.InputJsonValue,
    };

    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }
    if (description && typeof description === "string") {
      updateData.description = description.trim();
    }

    await db.workflow.update({
      where: { id: context.workflowId },
      data: updateData,
    });

    return {
      toolName: "create_or_update_workflow",
      success: true,
      message:
        summary ||
        `Workflow successfully created/updated with ${nodes.length} nodes and ${formattedEdges.length} connections.`,
      nodes: nodes,
      edges: formattedEdges,
      name: name || undefined,
    };
  } catch (error) {
    console.error("executeCreateOrUpdateWorkflow error:", error);
    return {
      toolName: "create_or_update_workflow",
      success: false,
      message: error instanceof Error ? error.message : "Failed to update workflow",
    };
  }
}
