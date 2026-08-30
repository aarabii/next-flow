export type WorkflowStatus = "IDLE" | "RUNNING" | "ERROR";

export type WorkflowRunStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "PARTIAL";

export type WorkflowRunScope = "FULL" | "PARTIAL" | "SINGLE";

export type NodeRunStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "SKIPPED";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  backgroundImage: string | null;
  status: WorkflowStatus;
  nodes: unknown;
  edges: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  userId: string;
  status: WorkflowRunStatus;
  scope: WorkflowRunScope;
  targetNodes: string[];
  duration: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface NodeRun {
  id: string;
  workflowRunId: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: NodeRunStatus;
  inputs: unknown;
  output: unknown;
  duration: number | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}
