import { SystemFlowCard } from "./_components/SystemFlowCard";
import { UserWorkflowsContainer } from "./_components/UserWorkflowsContainer";
import { ImportButton } from "./_components/ImportButton";
import { checkAndSyncUser } from "@/lib/auth";
import { NewWorkflowButton } from "./_components/NewWorkflowButton";
import { getUserWorkflowCards } from "@/lib/queries/workflows";
import { WorkflowPromptInput } from "./_components/WorkflowPromptInput";

export default async function DashboardPage() {
  const user = await checkAndSyncUser();
  const workflows = await getUserWorkflowCards(user.id);

  return (
    <div className="w-full pb-space-08 px-4 sm:px-6 md:px-12 lg:px-16 pt-space-08">
      {/* Top Header */}
      <div className="flex flex-col gap-space-05 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-space-03">
            <div className="min-w-0">
              <div className="font-secondary text-heading-lg-google font-semibold text-text-primary">
                Flow
              </div>
              <div className="text-small text-text-secondary">
                Build workflows or run models with AI
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-space-03">
          <ImportButton />
          <NewWorkflowButton />
        </div>
      </div>

      {/* Hero AI Prompt Input Bar */}
      <div className="mt-8 mb-4">
        <WorkflowPromptInput />
      </div>

      {/* System Templates Section */}
      <div className="mt-space-09">
        <div className="flex items-start justify-between gap-space-03 sm:items-center">
          <div>
            <div className="text-body text-text-primary font-medium font-secondary">
              System Templates
            </div>
            <div className="text-small text-text-secondary">
              Prebuilt workflow templates to get you started.
            </div>
          </div>
        </div>
        <div className="mt-space-06">
          <SystemFlowCard />
        </div>
      </div>

      {/* Your Workflows Section */}
      <div className="mt-space-09">
        <UserWorkflowsContainer initialWorkflows={workflows} />
      </div>
    </div>
  );
}
