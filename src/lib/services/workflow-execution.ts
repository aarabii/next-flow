import { db } from "@/lib/prisma";
import type { Node } from "@xyflow/react";
import { Prisma } from "../../../generated/prisma/client";

export interface CreateWorkflowRunParams {
  workflowId: string;
  userId: string;
  nodes: Node[];
  scope: "FULL" | "PARTIAL" | "SINGLE";
  targetNodeIds?: string[];
}

export interface CreateWorkflowRunResult {
  runId: string;
  scope: "FULL" | "PARTIAL" | "SINGLE";
  targetNodeIds: string[];
}

const VALID_NODE_TYPES = ["requestInput", "response", "cropImage", "textNode"];

export async function createAndTriggerWorkflowRun(
  params: CreateWorkflowRunParams,
): Promise<CreateWorkflowRunResult> {
  const { workflowId, userId, nodes: rawNodes, scope, targetNodeIds = [] } = params;

  const run = await db.workflowRun.create({
    data: {
      workflowId,
      userId,
      status: "RUNNING",
      scope,
      targetNodes: targetNodeIds,
    },
  });

  const nodes = (rawNodes || []).filter(
    (n) => n && typeof n === "object" && VALID_NODE_TYPES.includes(n.type || ""),
  );

  let nodesToExecute = nodes.filter(
    (n) => n.type === "cropImage" || n.type === "textNode",
  );

  if ((scope === "SINGLE" || scope === "PARTIAL") && targetNodeIds.length > 0) {
    nodesToExecute = nodesToExecute.filter((n) => targetNodeIds.includes(n.id));
  }

  const localNodes = nodes.filter(
    (n) => n.type === "requestInput" || n.type === "response",
  );

  const now = new Date();
  const nodeRunData: Prisma.NodeRunCreateManyInput[] = [];

  for (const node of localNodes) {
    const label = node.id === "request_inputs" ? "Request Inputs" : "Response";
    nodeRunData.push({
      workflowRunId: run.id,
      nodeId: node.id,
      nodeType: node.type || "",
      nodeLabel: label,
      status: "SUCCESS",
      inputs: {},
      output: (node.data as Prisma.InputJsonValue) || {},
      duration: 0.1,
      startedAt: now,
      completedAt: now,
    });
  }

  for (const node of nodesToExecute) {
    const label = node.type === "cropImage" ? "Crop Image" : "Text Generation";
    nodeRunData.push({
      workflowRunId: run.id,
      nodeId: node.id,
      nodeType: node.type || "",
      nodeLabel: label,
      status: "PENDING",
    });
  }

  if (nodeRunData.length > 0) {
    await db.nodeRun.createMany({
      data: nodeRunData,
    });
  }

  try {
    const { workflowOrchestratorTask } = await import("@/trigger/orchestrator");
    await workflowOrchestratorTask.trigger({
      workflowRunId: run.id,
    });
  } catch (triggerError) {
    console.warn("Could not trigger background orchestrator task:", triggerError);
  }

  return {
    runId: run.id,
    scope,
    targetNodeIds,
  };
}
