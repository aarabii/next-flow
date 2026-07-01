import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";
import type { Node } from "@xyflow/react";
import { Prisma } from "../../../../../../generated/prisma/client";

const ExecutePayloadSchema = z.object({
  scope: z.enum(["FULL", "PARTIAL", "SINGLE"]),
  targetNodeIds: z.array(z.string()).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workflowId } = await params;
    const body = await req.json();

    const result = ExecutePayloadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: result.error.format() },
        { status: 400 },
      );
    }

    const { scope, targetNodeIds } = result.data;

    const workflow = await db.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    const run = await db.workflowRun.create({
      data: {
        workflowId,
        userId: user.id,
        status: "RUNNING",
        scope,
        targetNodes: targetNodeIds || [],
      },
    });

    const VALID_NODE_TYPES = ["requestInput", "response", "cropImage", "textNode"];
    const nodes = (workflow.nodes as unknown as Node[]).filter(
      (n) => n && typeof n === "object" && VALID_NODE_TYPES.includes(n.type || ""),
    );

    let nodesToExecute = nodes.filter(
      (n) =>
        n.type === "cropImage" ||
        n.type === "textNode",
    );

    if (scope === "SINGLE" && targetNodeIds && targetNodeIds.length > 0) {
      nodesToExecute = nodesToExecute.filter((n) =>
        targetNodeIds.includes(n.id),
      );
    } else if (
      scope === "PARTIAL" &&
      targetNodeIds &&
      targetNodeIds.length > 0
    ) {
      nodesToExecute = nodesToExecute.filter((n) =>
        targetNodeIds.includes(n.id),
      );
    }

    const localNodes = nodes.filter(
      (n) => n.type === "requestInput" || n.type === "response",
    );

    for (const node of localNodes) {
      const label =
        node.id === "request_inputs" ? "Request Inputs" : "Response";
      await db.nodeRun.create({
        data: {
          workflowRunId: run.id,
          nodeId: node.id,
          nodeType: node.type || "",
          nodeLabel: label,
          status: "SUCCESS",
          inputs: {},
          output: node.data as Prisma.InputJsonValue,
          duration: 0.1,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
    }

    for (const node of nodesToExecute) {
      const label =
        node.type === "cropImage"
          ? "Crop Image"
          : "Text Generation";
      await db.nodeRun.create({
        data: {
          workflowRunId: run.id,
          nodeId: node.id,
          nodeType: node.type || "",
          nodeLabel: label,
          status: "PENDING",
        },
      });
    }

    const { workflowOrchestratorTask } = await import("@/trigger/orchestrator");
    await workflowOrchestratorTask.trigger({
      workflowRunId: run.id,
    });

    return NextResponse.json({ success: true, runId: run.id });
  } catch (error) {
    console.error("POST /api/workflows/[id]/execute error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to execute workflow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
