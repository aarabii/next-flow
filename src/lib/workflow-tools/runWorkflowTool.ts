import type { Node } from "@xyflow/react";
import type { ToolExecutionContext, ToolResult } from "./types";
import { createAndTriggerWorkflowRun } from "@/lib/services/workflow-execution";

export interface RunWorkflowArgs {
  scope?: "FULL" | "SINGLE" | "PARTIAL";
  targetNodeIds?: string[];
}

export async function executeRunWorkflow(
  args: RunWorkflowArgs,
  context: ToolExecutionContext,
): Promise<ToolResult> {
  try {
    const scope = args.scope || "FULL";
    const targetNodeIds = args.targetNodeIds || [];
    const workflow = context.workflow;

    const runResult = await createAndTriggerWorkflowRun({
      workflowId: context.workflowId,
      userId: context.userId,
      nodes: (workflow.nodes as unknown as Node[]) || [],
      scope,
      targetNodeIds,
    });

    return {
      toolName: "run_workflow",
      success: true,
      runId: runResult.runId,
      message:
        scope === "FULL"
          ? `Started full workflow execution (Run ID: ${runResult.runId}).`
          : `Started execution for node(s): ${targetNodeIds.join(", ")} (Run ID: ${runResult.runId}).`,
      data: {
        runId: runResult.runId,
        scope,
        targetNodeIds,
      },
    };
  } catch (error) {
    console.error("executeRunWorkflow error:", error);
    return {
      toolName: "run_workflow",
      success: false,
      message: error instanceof Error ? error.message : "Failed to run workflow",
    };
  }
}
