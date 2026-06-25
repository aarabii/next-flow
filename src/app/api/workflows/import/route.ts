import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";

const ImportWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nodes: z.array(z.any()).nonempty("Nodes list is required"),
  edges: z.array(z.any()).optional().default([]),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const result = ImportWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, nodes, edges } = result.data;

    const workflow = await db.workflow.create({
      data: {
        userId: user.id,
        name,
        nodes,
        edges,
      },
    });

    return NextResponse.json(workflow);
  } catch (error: any) {
    console.error("POST /api/workflows/import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import workflow" },
      { status: 500 }
    );
  }
}
