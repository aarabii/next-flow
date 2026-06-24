import { redirect } from "next/navigation";
import { checkAndSyncUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { WorkflowCanvas } from "../_components/WorkflowCanvas";
import type { Node, Edge } from "@xyflow/react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowCanvasPage({ params }: PageProps) {
  const { id } = await params;
  const user = await checkAndSyncUser();

  const workflow = await db.workflow.findUnique({
    where: { id },
  });

  if (!workflow || workflow.userId !== user.id) {
    redirect("/dashboard");
  }

  const initialNodes = (workflow.nodes as unknown as Node[]) || [];
  const initialEdges = (workflow.edges as unknown as Edge[]) || [];

  return (
    <div className="relative w-full h-full min-h-screen bg-zinc-50 flex flex-col text-zinc-900">
      <WorkflowCanvas
        workflowId={id}
        workflowName={workflow.name}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
      />
    </div>
  );
}

