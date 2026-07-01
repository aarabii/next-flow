import { redirect } from "next/navigation";
import { checkAndSyncUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { WorkflowCanvas } from "../_components/WorkflowCanvas";
import { Prisma } from "../../../../../generated/prisma/client";
import type { Node, Edge } from "@xyflow/react";
import {
  SYSTEM_WORKFLOWS,
  SYSTEM_WORKFLOW_IDS,
} from "@/config/systemWorkflows";

interface PageProps {
  params: Promise<{ id: string }>;
}


export default async function WorkflowCanvasPage({ params }: PageProps) {
  const { id } = await params;
  const user = await checkAndSyncUser();

  const isSystemTemplate = SYSTEM_WORKFLOW_IDS.includes(id);
  const targetId = isSystemTemplate ? `${user.id}-${id}` : id;

  let workflow = await db.workflow.findUnique({
    where: { id: targetId },
  });

  if (!workflow) {
    if (isSystemTemplate) {
      const template = SYSTEM_WORKFLOWS.find((sw) => sw.id === id);
      if (!template) {
        redirect("/dashboard");
      }

      workflow = await db.workflow.create({
        data: {
          id: targetId,
          userId: user.id,
          name: template.name,
          backgroundImage: template.backgroundImage,
          nodes: template.nodes as unknown as Prisma.InputJsonValue,
          edges: template.edges as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      redirect("/dashboard");
    }
  }

  if (workflow.userId !== user.id) {
    redirect("/dashboard");
  }

  const initialNodes = (workflow.nodes as unknown as Node[]) || [];
  const initialEdges = (workflow.edges as unknown as Edge[]) || [];

  return (
    <div className="relative w-full h-full min-h-screen bg-zinc-50 flex flex-col text-zinc-900">
      <WorkflowCanvas
        workflowId={targetId}
        workflowName={workflow.name}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
      />
    </div>
  );
}
