import { db } from "@/lib/prisma";
import type { Node, Edge } from "@xyflow/react";
import type { ToolExecutionContext, ToolResult } from "./types";
import { Prisma } from "../../../generated/prisma/client";

export interface CreateWorkflowArgs {
  nodes: Node[];
  edges: Edge[];
  summary?: string;
}

export async function executeCreateOrUpdateWorkflow(
  args: CreateWorkflowArgs,
  context: ToolExecutionContext,
): Promise<ToolResult> {
  try {
    const { nodes, edges, summary } = args;

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
      type: e.type || "smoothstep",
      animated: e.animated !== undefined ? e.animated : true,
      style: e.style || { stroke: "#a855f7", strokeWidth: 2 },
    }));

    await db.workflow.update({
      where: { id: context.workflowId },
      data: {
        nodes: nodes as unknown as Prisma.InputJsonValue,
        edges: formattedEdges as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      toolName: "create_or_update_workflow",
      success: true,
      message: summary || `Workflow successfully updated with ${nodes.length} nodes and ${formattedEdges.length} connections.`,
      nodes: nodes,
      edges: formattedEdges,
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
