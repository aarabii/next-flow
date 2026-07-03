import { SystemFlowCard } from "./_components/SystemFlowCard";
import { UserWorkflowsContainer } from "./_components/UserWorkflowsContainer";
import { ImportButton } from "./_components/ImportButton";
import { checkAndSyncUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { NewWorkflowButton } from "./_components/NewWorkflowButton";
import { SYSTEM_WORKFLOW_IDS } from "@/config/systemWorkflows";
import { timeAgo, GRADIENTS } from "@/lib/utils";

export default async function DashboardPage() {
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
    <div className="w-full pb-space-08 px-4 sm:px-6 md:px-12 lg:px-16 pt-space-08">
      <div className="flex flex-col gap-space-05 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-space-03">
            <div className="min-w-0">
              <div className="font-secondary text-heading-lg-google font-semibold text-text-primary">
                Flow
              </div>
              <div className="text-small text-text-secondary">
                Build workflows or run models directly
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
        <div className="flex items-start justify-between gap-space-03 sm:items-center">
          <div>
            <div className="text-body text-text-primary font-medium font-secondary">
              System Workflows
            </div>
            <div className="text-small text-text-secondary">
              Prebuilt workflow templates - click to open and start using.
            </div>
          </div>
        </div>
        <div className="mt-space-06">
          <SystemFlowCard />
        </div>
      </div>

      <div className="mt-space-09">
        <UserWorkflowsContainer initialWorkflows={workflows} />
      </div>
    </div>
  );
}
