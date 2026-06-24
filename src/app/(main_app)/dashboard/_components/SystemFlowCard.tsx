import Link from "next/link";

interface SystemWorkflow {
  id: string;
  title: string;
  href: string;
  gradient: string;
  icon: React.ReactNode;
}

const SYSTEM_WORKFLOWS: SystemWorkflow[] = [
  {
    id: "ai-racing-car",
    title: "AI Racing Car Generator",
    href: "/app/workflows/ai-racing-car",
    gradient: "from-red-500/20 via-orange-500/20 to-yellow-500/10",
    icon: (
      <svg
        className="w-12 h-12 text-orange-500/70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.3 16.2L12 18l-3.3-1.8m6.6-6.6L12 7.8l-3.3 1.8M12 2.25v5.5m0 10.5v3.5m0-14v5m0 5v4"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: "slack-dispatcher",
    title: "Slack Alert Dispatcher",
    href: "/app/workflows/slack-dispatcher",
    gradient: "from-indigo-500/20 via-purple-500/20 to-pink-500/10",
    icon: (
      <svg
        className="w-12 h-12 text-indigo-500/70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 10.742h.01m3.992 0h.01M16.5 16.5h.008m-3.996 0h.008m-3.996 0h.008M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    id: "db-backup-sync",
    title: "Database Backup Sync",
    href: "/app/workflows/db-backup-sync",
    gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/10",
    icon: (
      <svg
        className="w-12 h-12 text-emerald-500/70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75m-16.5-3.75v3.75"
        />
      </svg>
    ),
  },
];

export const SystemFlowCard = () => {
  return (
    <div
      className="flex gap-space-07 overflow-x-auto scroll-smooth pb-space-02 scrollbar-none"
      style={{ scrollSnapType: "x mandatory" }}
    >
      {SYSTEM_WORKFLOWS.map((workflow) => (
        <Link
          key={workflow.id}
          className="group w-[80vw] max-w-xs flex-none overflow-hidden rounded-radius-xxl border border-width-s border-boarder-tertiary bg-surface-main-background-2 text-left transition-colors hover:border-boarder-secondary sm:w-72 lg:w-80"
          href={workflow.href}
          style={{ scrollSnapAlign: "start" }}
        >
          <div className="relative aspect-288/196 bg-surface-main-background-3 flex items-center justify-center bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] overflow-hidden bg-size-[16px_16px]">
            <div
              className={`absolute inset-0 bg-linear-to-br ${workflow.gradient} opacity-60`}
            />
            <div className="relative transition-transform duration-300 group-hover:scale-110">
              {workflow.icon}
            </div>
          </div>
          <div className="flex items-center justify-center px-space-05 py-space-04">
            <div className="truncate text-body text-text-primary font-medium">
              {workflow.title}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
