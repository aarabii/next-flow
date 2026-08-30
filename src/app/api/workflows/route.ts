import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { SYSTEM_WORKFLOW_IDS } from "@/config/systemWorkflows";
import { DEFAULT_INITIAL_NODES } from "@/config/defaults";
import { Prisma } from "../../../../generated/prisma/client";

const CreateWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").default("Untitled Workflow"),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await db.workflow.findMany({
      where: {
        userId: user.id,
        NOT: {
          id: {
            in: SYSTEM_WORKFLOW_IDS.map((sysId) => `${user.id}-${sysId}`),
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
        createdAt: true,
        backgroundImage: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("GET /api/workflows error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch workflows";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch {}

    const result = CreateWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: result.error.format() },
        { status: 400 },
      );
    }

    const { name, description } = result.data;

    const workflow = await db.workflow.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        nodes: DEFAULT_INITIAL_NODES as unknown as Prisma.InputJsonValue,
        edges: [],
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("POST /api/workflows error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create workflow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
