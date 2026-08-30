import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";
import type { Node } from "@xyflow/react";
import { createAndTriggerWorkflowRun } from "@/lib/services/workflow-execution";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

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

    const isAllowed = await limiter.check(15, `exec_${user.id}`);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many execution requests. Please wait a minute before triggering again." },
        { status: 429 },
      );
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
      select: {
        nodes: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    const runResult = await createAndTriggerWorkflowRun({
      workflowId,
      userId: user.id,
      nodes: (workflow.nodes as unknown as Node[]) || [],
      scope,
      targetNodeIds,
    });

    return NextResponse.json({ success: true, runId: runResult.runId });
  } catch (error) {
    console.error("POST /api/workflows/[id]/execute error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to execute workflow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
