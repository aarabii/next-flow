import { db } from "@/lib/prisma";
import type { ToolExecutionContext, ToolResult } from "./types";

export interface NameWorkflowArgs {
  name: string;
  description?: string;
}

export async function executeNameWorkflow(
  args: NameWorkflowArgs,
  context: ToolExecutionContext,
): Promise<ToolResult> {
  try {
    const { name, description } = args;

    if (!name || typeof name !== "string" || !name.trim()) {
      return {
        toolName: "generate_workflow_name",
        success: false,
        message: "A valid workflow name is required.",
      };
    }

    const trimmedName = name.trim();
    const trimmedDescription = description ? description.trim() : undefined;

    await db.workflow.update({
      where: { id: context.workflowId },
      data: {
        name: trimmedName,
        ...(trimmedDescription !== undefined && { description: trimmedDescription }),
      },
    });

    return {
      toolName: "generate_workflow_name",
      success: true,
      name: trimmedName,
      description: trimmedDescription,
      message: `Workflow renamed to "${trimmedName}".`,
      data: {
        name: trimmedName,
        description: trimmedDescription,
      },
    };
  } catch (error) {
    console.error("executeNameWorkflow error:", error);
    return {
      toolName: "generate_workflow_name",
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to rename workflow",
    };
  }
}
