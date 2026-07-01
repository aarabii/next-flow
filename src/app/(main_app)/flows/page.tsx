import { NewWorkflowButton } from "../dashboard/_components/NewWorkflowButton";
import { ImportButton } from "../dashboard/_components/ImportButton";
import { UserWorkflowsContainer } from "../dashboard/_components/UserWorkflowsContainer";
import { checkAndSyncUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { SYSTEM_WORKFLOW_IDS } from "@/config/systemWorkflows";
import { timeAgo, GRADIENTS } from "@/lib/utils";

export default async function FlowsPage() {
  const user = await checkAndSyncUser();

  const dbWorkflows = await db.workflow.findMany({
    where: {
      userId: user.id,
      NOT: {
        id: {
          in: SYSTEM_WORKFLOW_IDS.map((sysId) => `${user.id}-${sysId}`),
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const workflows = dbWorkflows.map((w, idx) => ({
    id: w.id,
    title: w.name,
    href: `/workflows/${w.id}`,
    editedAt: timeAgo(w.updatedAt),
    gradient: GRADIENTS[idx % GRADIENTS.length],
    backgroundImage: w.backgroundImage,
  }));

  return (
    <div className="w-full pb-space-08 pl-15 pr-15 pt-space-08">
      <div className="flex flex-col gap-space-05 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-space-03">
            <div className="min-w-0">
              <div className="font-secondary text-heading-lg-google font-semibold text-text-primary">
                Workflows
              </div>
              <div className="text-small text-text-secondary">
                Manage your created workflows
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-space-03">
          <ImportButton />
          <NewWorkflowButton />
        </div>
      </div>

      <div className="mt-space-09">
        <UserWorkflowsContainer initialWorkflows={workflows} />
      </div>
    </div>
  );
}
