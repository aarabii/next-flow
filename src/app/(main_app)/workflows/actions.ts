"use server";

import { checkAndSyncUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function saveWorkflowAction(id: string, nodes: any[], edges: any[]) {
  const user = await checkAndSyncUser();

  await db.workflow.updateMany({
    where: {
      id,
      userId: user.id,
    },
    data: {
      nodes: nodes,
      edges: edges,
    },
  });
}

export async function executeWorkflowAction(
  workflowId: string,
  scope: "FULL" | "PARTIAL" | "SINGLE",
  targetNodeIds?: string[]
) {
  const user = await checkAndSyncUser();

  // 1. Get the workflow
  const workflow = await db.workflow.findUnique({
    where: {
      id: workflowId,
      userId: user.id,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // 2. Create the WorkflowRun
  const run = await db.workflowRun.create({
    data: {
      workflowId,
      userId: user.id,
      status: "RUNNING",
      scope,
      targetNodes: targetNodeIds || [],
      startedAt: new Date(),
    },
  });

  // 3. Parse nodes to execute
  const nodes = workflow.nodes as any[];
  const edges = workflow.edges as any[];

  // Define target executable nodes
  let nodesToExecute = nodes.filter(
    (n) =>
      n.type === "cropImage" ||
      n.type === "gemini" ||
      n.type === "textNode" ||
      n.type === "imageNode" ||
      n.type === "videoNode" ||
      n.type === "audioNode"
  );

  if (scope === "SINGLE" && targetNodeIds && targetNodeIds.length > 0) {
    nodesToExecute = nodesToExecute.filter((n) => targetNodeIds.includes(n.id));
  } else if (scope === "PARTIAL" && targetNodeIds && targetNodeIds.length > 0) {
    nodesToExecute = nodesToExecute.filter((n) => targetNodeIds.includes(n.id));
  }

  // 4. Create NodeRun records
  const localNodes = nodes.filter((n) => n.type === "requestInput" || n.type === "response");
  
  for (const node of localNodes) {
    let label = node.id === "request_inputs" ? "Request Inputs" : "Response";
    await db.nodeRun.create({
      data: {
        workflowRunId: run.id,
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: label,
        status: "SUCCESS",
        inputs: {},
        output: node.data,
        duration: 0.1,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });
  }

  for (const node of nodesToExecute) {
    let label =
      node.type === "cropImage"
        ? "Crop Image"
        : node.type === "textNode"
        ? "Text Generation"
        : node.type === "imageNode"
        ? "Image Generation"
        : node.type === "videoNode"
        ? "Video Generation"
        : node.type === "audioNode"
        ? "Audio Generation"
        : `${node.data.model || "Gemini"} LLM`;
    await db.nodeRun.create({
      data: {
        workflowRunId: run.id,
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: label,
        status: "PENDING",
      },
    });
  }

  // 5. Trigger the orchestrator task
  const { workflowOrchestratorTask } = await import("@/trigger/orchestrator");
  await workflowOrchestratorTask.trigger({
    workflowRunId: run.id,
  });

  return { success: true, runId: run.id };
}

export async function getWorkflowRunsAction(workflowId: string) {
  const user = await checkAndSyncUser();

  const runs = await db.workflowRun.findMany({
    where: {
      workflowId,
      userId: user.id,
    },
    include: {
      nodeRuns: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return runs.map((run, index, arr) => {
    const runNumber = arr.length - index;
    return {
      id: run.id,
      runNumber,
      status: run.status as "SUCCESS" | "FAILED" | "PARTIAL" | "RUNNING",
      createdAt: run.createdAt.toLocaleString(),
      duration: run.duration ? Math.round(run.duration * 10) / 10 : 0,
      scope: run.scope as "FULL" | "PARTIAL" | "SINGLE",
      nodeRuns: run.nodeRuns.map((nr) => ({
        id: nr.id,
        nodeId: nr.nodeId,
        nodeLabel: nr.nodeLabel,
        nodeType: nr.nodeType,
        status: nr.status as "SUCCESS" | "FAILED" | "RUNNING" | "SKIPPED",
        duration: nr.duration ? Math.round(nr.duration * 10) / 10 : 0,
        inputs: nr.inputs,
        output: nr.output,
        error: nr.error,
      })),
    };
  });
}

export async function getWorkflowRunStatusAction(runId: string) {
  const user = await checkAndSyncUser();

  const run = await db.workflowRun.findFirst({
    where: {
      id: runId,
      userId: user.id,
    },
    include: {
      nodeRuns: true,
    },
  });

  if (!run) return null;

  return {
    status: run.status,
    nodeRuns: run.nodeRuns.map((nr) => ({
      nodeId: nr.nodeId,
      status: nr.status,
    })),
  };
}

export async function getWorkflowAction(id: string) {
  const user = await checkAndSyncUser();

  const workflow = await db.workflow.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  return workflow;
}



