import { Upload, Plus } from "lucide-react";
import { SystemFlowCard } from "./_components/SystemFlowCard";
import { SearchBar } from "./_components/SearchBar";
import { UserFlowCard } from "./_components/UserFlowCard";

export default async function DashboardPage() {
  return (
    <div className="w-full pb-space-08 pl-15 pr-15 pt-space-08">
      {/* Header */}
      <div className="flex flex-col gap-space-05 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-space-03">
            <div className="min-w-0">
              <div className="font-body text-heading-lg-google font-semibold text-text-primary">
                Flow
              </div>
              <div className="text-small text-text-secondary">
                Build workflows or run models directly
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-space-03">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-space-03 rounded-radius-l bg-surface-primary px-space-04 text-button text-text-primary transition-colors hover:bg-surface-secondary disabled:opacity-40"
            title="Import workflow JSON"
          >
            <Upload className="w-4 h-4 text-icon-primary" aria-hidden="true" />
            Import
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-radius-l bg-surface-on-action text-icon-on-action transition-colors hover:opacity-90 disabled:opacity-40"
            title="Create a new workflow"
            aria-label="New workflow"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* System Workflows Section */}
      <div className="mt-space-09">
        <div className="flex items-start justify-between gap-space-03 sm:items-center">
          <div>
            <div className="text-body text-text-primary font-medium">
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

      {/* User Workflows Section */}
      <div className="mt-space-09">
        <div className="flex flex-col gap-space-04 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-body text-text-primary font-medium">
              Your Workflows
            </div>
            <div className="text-small text-text-secondary">
              Open one to edit, run, and review history.
            </div>
          </div>
          <SearchBar />
        </div>
        <UserFlowCard />
      </div>
    </div>
  );
}
