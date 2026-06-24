import { Plus } from "lucide-react";
import { SystemFlowCard } from "./_components/SystemFlowCard";
import { SearchBar } from "./_components/SearchBar";
import { UserFlowCard } from "./_components/UserFlowCard";
import { ImportButton } from "./_components/ImportButton";
import { checkAndSyncUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { createWorkflowAction } from "./actions";


const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Edited just now";
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `Edited ${interval}y ago`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `Edited ${interval}mo ago`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `Edited ${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `Edited ${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `Edited ${interval}m ago`;
  return "Edited just now";
};

const GRADIENTS = [
  "from-red-500/10 via-orange-500/10 to-yellow-500/5",
  "from-indigo-500/10 via-purple-500/10 to-pink-500/5",
  "from-emerald-500/10 via-teal-500/10 to-cyan-500/5",
  "from-blue-500/10 via-sky-500/10 to-indigo-500/5",
];

export default async function DashboardPage() {
  const user = await checkAndSyncUser();

  const dbWorkflows = await db.workflow.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const workflows = dbWorkflows.map((w, idx) => ({
    id: w.id,
    title: w.name,
    href: `/workflows/${w.id}`,
    editedAt: timeAgo(w.updatedAt),
    gradient: GRADIENTS[idx % GRADIENTS.length],
  }));

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
          <ImportButton />
          <form action={createWorkflowAction}>
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-radius-l bg-surface-on-action text-icon-on-action transition-colors hover:opacity-90 disabled:opacity-40 cursor-pointer"
              title="Create a new workflow"
              aria-label="New workflow"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
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
        <UserFlowCard initialWorkflows={workflows} />
      </div>
    </div>
  );
}
