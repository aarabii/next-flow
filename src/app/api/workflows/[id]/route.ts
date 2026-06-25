import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "../../../../../generated/prisma/client";

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  description: z.string().nullable().optional(),
  backgroundImage: z.string().nullable().optional(),
  nodes: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const workflow = await db.workflow.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("GET /api/workflows/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch workflow";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const result = UpdateWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: result.error.format() },
        { status: 400 }
      );
    }

    // Check ownership
    const existing = await db.workflow.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const updated = await db.workflow.update({
      where: { id },
      data: {
        ...(result.data.name !== undefined && { name: result.data.name }),
        ...(result.data.description !== undefined && { description: result.data.description }),
        ...(result.data.backgroundImage !== undefined && { backgroundImage: result.data.backgroundImage }),
        ...(result.data.nodes !== undefined && { nodes: result.data.nodes as unknown as Prisma.InputJsonValue }),
        ...(result.data.edges !== undefined && { edges: result.data.edges as unknown as Prisma.InputJsonValue }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/workflows/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to update workflow";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.workflow.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    await db.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workflows/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete workflow";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
