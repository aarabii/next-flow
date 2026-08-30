import { NewWorkflowButton } from "../dashboard/_components/NewWorkflowButton";
import { ImportButton } from "../dashboard/_components/ImportButton";
import { UserWorkflowsContainer } from "../dashboard/_components/UserWorkflowsContainer";
import { checkAndSyncUser } from "@/lib/auth";
import { getUserWorkflowCards } from "@/lib/queries/workflows";

export default async function FlowsPage() {
  const user = await checkAndSyncUser();
  const workflows = await getUserWorkflowCards(user.id);

  return (
    <div className="w-full pb-space-08 px-4 sm:px-6 md:px-12 lg:px-16 pt-space-08">
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
