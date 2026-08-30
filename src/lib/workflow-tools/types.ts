import type { Node, Edge } from "@xyflow/react";
import type { Workflow } from "../../../generated/prisma/client";

export interface MediaFileAttachment {
  url: string;
  name?: string;
  type: string; // e.g. "image/png", "audio/mp3", "video/mp4"
}

export interface ToolExecutionContext {
  workflowId: string;
  userId: string;
  workflow: Workflow;
  currentNodes: Node[];
  currentEdges: Edge[];
  mediaFiles?: MediaFileAttachment[];
}

export interface ToolResult {
  toolName: string;
  success: boolean;
  message?: string;
  name?: string;
  description?: string;
  nodes?: Node[];
  edges?: Edge[];
  runId?: string;
  backgroundImage?: string;
  data?: Record<string, unknown>;
}
