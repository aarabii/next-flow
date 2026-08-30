import { db } from "@/lib/prisma";
import type { ToolExecutionContext, ToolResult } from "./types";

export interface SetBackgroundArgs {
  backgroundImageUrl: string;
}

export async function executeSetWorkflowBackground(
  args: SetBackgroundArgs,
  context: ToolExecutionContext,
): Promise<ToolResult> {
  try {
    const { backgroundImageUrl } = args;

    if (!backgroundImageUrl || typeof backgroundImageUrl !== "string") {
      return {
        toolName: "set_workflow_background",
        success: false,
        message: "A valid background image URL is required.",
      };
    }

    await db.workflow.update({
      where: { id: context.workflowId },
      data: {
        backgroundImage: backgroundImageUrl,
      },
    });

    return {
      toolName: "set_workflow_background",
      success: true,
      backgroundImage: backgroundImageUrl,
      message: `Workflow card background image updated successfully.`,
      data: {
        backgroundImage: backgroundImageUrl,
      },
    };
  } catch (error) {
    console.error("executeSetWorkflowBackground error:", error);
    return {
      toolName: "set_workflow_background",
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to set workflow background",
    };
  }
}
