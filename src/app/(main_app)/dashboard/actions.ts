"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkAndSyncUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

const initialNodes = [
  {
    id: "request_inputs",
    type: "requestInput",
    position: { x: 50, y: 150 },
    data: {
      fields: [
        { id: "text_field", type: "text_field", label: "Text Field", value: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design." },
        { id: "image_field", type: "image_field", label: "Image Field", value: "" }
      ]
    },
    deletable: false,
  },
  {
    id: "response",
    type: "response",
    position: { x: 900, y: 250 },
    data: {
      results: []
    },
    deletable: false,
  }
];

export async function createWorkflowAction() {
  const user = await checkAndSyncUser();

  const workflow = await db.workflow.create({
    data: {
      userId: user.id,
      name: "Untitled Workflow",
      nodes: initialNodes,
      edges: [],
    },
  });

  revalidatePath("/dashboard");
  redirect(`/workflows/${workflow.id}`);
}

export async function renameWorkflowAction(id: string, name: string) {
  const user = await checkAndSyncUser();

  await db.workflow.updateMany({
    where: {
      id,
      userId: user.id,
    },
    data: {
      name,
    },
  });

  revalidatePath("/dashboard");
}

export async function deleteWorkflowAction(id: string) {
  const user = await checkAndSyncUser();

  await db.workflow.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  revalidatePath("/dashboard");
}

export async function importWorkflowAction(name: string, nodes: any[], edges: any[]) {
  const user = await checkAndSyncUser();

  const workflow = await db.workflow.create({
    data: {
      userId: user.id,
      name: name || "Imported Workflow",
      nodes: nodes || [],
      edges: edges || [],
    },
  });

  revalidatePath("/dashboard");
  redirect(`/workflows/${workflow.id}`);
}

export async function updateWorkflowBackgroundAction(id: string, backgroundImage: string) {
  const user = await checkAndSyncUser();

  await db.workflow.updateMany({
    where: {
      id,
      userId: user.id,
    },
    data: {
      backgroundImage,
    },
  });

  revalidatePath("/dashboard");
}


