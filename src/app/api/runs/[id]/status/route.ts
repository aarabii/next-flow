import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: runId } = await params;

    const run = await db.workflowRun.findFirst({
      where: {
        id: runId,
        userId: user.id,
      },
      select: {
        status: true,
        nodeRuns: {
          select: {
            nodeId: true,
            status: true,
          },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const runStatus = {
      status: run.status,
      nodeRuns: run.nodeRuns.map((nr) => ({
        nodeId: nr.nodeId,
        status: nr.status,
      })),
    };

    return NextResponse.json(runStatus);
  } catch (error) {
    console.error("GET /api/runs/[id]/status error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch run status";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
