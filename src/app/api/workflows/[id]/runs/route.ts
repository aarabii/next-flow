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

    const { id: workflowId } = await params;
    const url = new URL(req.url);
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") || "50", 10), 1),
      100,
    );

    const totalCount = await db.workflowRun.count({
      where: {
        workflowId,
        userId: user.id,
      },
    });

    const runs = await db.workflowRun.findMany({
      where: {
        workflowId,
        userId: user.id,
      },
      include: {
        nodeRuns: {
          orderBy: {
            startedAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const formattedRuns = runs.map((run, index) => {
      const runNumber = totalCount - index;
      return {
        id: run.id,
        runNumber,
        status: run.status,
        createdAt: run.createdAt.toLocaleString(),
        createdAtIso: run.createdAt.toISOString(),
        startedAtIso: run.startedAt ? run.startedAt.toISOString() : null,
        duration: run.duration ? Math.round(run.duration * 10) / 10 : 0,
        scope: run.scope,
        targetNodes: run.targetNodes,
        nodeRuns: run.nodeRuns.map((nr) => ({
          id: nr.id,
          nodeId: nr.nodeId,
          nodeLabel: nr.nodeLabel,
          nodeType: nr.nodeType,
          status: nr.status,
          duration: nr.duration ? Math.round(nr.duration * 10) / 10 : 0,
          inputs: nr.inputs,
          output: nr.output,
          error: nr.error,
          startedAtIso: nr.startedAt ? nr.startedAt.toISOString() : null,
        })),
      };
    });

    return NextResponse.json(formattedRuns);
  } catch (error) {
    console.error("GET /api/workflows/[id]/runs error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch runs history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
