import { NewWorkflowButton } from "../dashboard/_components/NewWorkflowButton";
import { ImportButton } from "../dashboard/_components/ImportButton";
import { UserWorkflowsContainer } from "../dashboard/_components/UserWorkflowsContainer";
import { checkAndSyncUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

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

export default async function FlowsPage() {
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
    backgroundImage: w.backgroundImage,
  }));

  return (
    <div className="w-full pb-space-08 pl-15 pr-15 pt-space-08">
      {/* Header */}
      <div className="flex flex-col gap-space-05 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-space-03">
            <div className="min-w-0">
              <div className="font-body text-heading-lg-google font-semibold text-text-primary">
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

      {/* User Workflows Section */}
      <div className="mt-space-09">
        <UserWorkflowsContainer initialWorkflows={workflows} />
      </div>
    </div>
  );
}
