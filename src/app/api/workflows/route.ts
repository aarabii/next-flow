import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";

// Inline Zod schemas for this endpoint's requests
const CreateWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").default("Untitled Workflow"),
  description: z.string().optional(),
});

const initialNodes = [
  {
    id: "request_inputs",
    type: "requestInput",
    position: { x: 50, y: 150 },
    data: {
      fields: [
        {
          id: "text_field",
          type: "text_field",
          label: "Text Field",
          value:
            "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
        },
        { id: "image_field", type: "image_field", label: "Image Field", value: "" },
      ],
    },
    deletable: false,
  },
  {
    id: "response",
    type: "response",
    position: { x: 900, y: 250 },
    data: {
      results: [],
    },
    deletable: false,
  },
];

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await db.workflow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("GET /api/workflows error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch workflows";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
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
    } catch {
      // Allow empty bodies
    }

    // Validate body inline using Zod
    const result = CreateWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, description } = result.data;

    const workflow = await db.workflow.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        nodes: initialNodes,
        edges: [],
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("POST /api/workflows error:", error);
    const message = error instanceof Error ? error.message : "Failed to create workflow";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
