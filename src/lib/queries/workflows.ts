import { db } from "@/lib/prisma";
import { SYSTEM_WORKFLOW_IDS } from "@/config/systemWorkflows";
import { timeAgo, GRADIENTS } from "@/lib/utils";

export interface UserWorkflowCardItem {
  id: string;
  title: string;
  href: string;
  editedAt: string;
  gradient: string;
  backgroundImage?: string | null;
}

export async function getUserWorkflowCards(userId: string): Promise<UserWorkflowCardItem[]> {
  const dbWorkflows = await db.workflow.findMany({
    where: {
      userId,
      NOT: {
        id: {
          in: SYSTEM_WORKFLOW_IDS.map((sysId) => `${userId}-${sysId}`),
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      backgroundImage: true,
    },
  });

  return dbWorkflows.map((w, idx) => ({
    id: w.id,
    title: w.name,
    href: `/workflows/${w.id}`,
    editedAt: timeAgo(w.updatedAt),
    gradient: GRADIENTS[idx % GRADIENTS.length],
    backgroundImage: w.backgroundImage,
  }));
}
