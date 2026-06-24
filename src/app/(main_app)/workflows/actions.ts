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
