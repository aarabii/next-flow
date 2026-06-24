"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { WorkflowActionsDropdown } from "./WorkflowActionsDropdown";
import { renameWorkflowAction, deleteWorkflowAction } from "../actions";

interface UserWorkflow {
  id: string;
  title: string;
  href: string;
  editedAt: string;
  gradient: string;
}

interface UserFlowCardProps {
  initialWorkflows: UserWorkflow[];
}

export const UserFlowCard = ({ initialWorkflows }: UserFlowCardProps) => {
  const router = useRouter();

  const handleRename = async (id: string, currentTitle: string) => {
    const newName = prompt("Rename workflow", currentTitle);
    if (newName && newName.trim() && newName.trim() !== currentTitle) {
      await renameWorkflowAction(id, newName.trim());
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteWorkflowAction(id);
    }
  };

  if (initialWorkflows.length === 0) {
    return (
      <div className="mt-space-06 flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-2xl py-12 px-4 text-center bg-zinc-50/20 max-w-xl">
        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-200/50">
          <ImagePlus className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">No Workflows</div>
        <p className="text-xs text-zinc-400 max-w-[280px]">
          Create a new workflow to get started on the visual canvas.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-space-06 grid grid-cols-1 gap-space-07 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {initialWorkflows.map((workflow) => (
        <div key={workflow.id} className="group/card relative max-w-62 w-full">
          <div className="relative overflow-hidden rounded-xl border border-border shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md bg-white">
            <Link
              className="block aspect-250/162 bg-surface-main-background-3 dark:bg-card relative bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[12px_12px] overflow-hidden"
              href={workflow.href}
            >
              <div
                className={`absolute inset-0 bg-linear-to-br ${workflow.gradient} opacity-50`}
              />

              {/* Premium abstract mini-workflow nodes placeholder */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-75">
                <svg
                  className="w-full h-full text-foreground/20"
                  viewBox="0 0 100 60"
                  fill="none"
                >
                  {/* Connection lines */}
                  <path
                    d="M25 30 L50 18 M25 30 L50 42 M50 18 L75 30 M50 42 L75 30"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  {/* Start Node */}
                  <rect
                    x="15"
                    y="24"
                    width="12"
                    height="12"
                    rx="3"
                    fill="currentColor"
                    fillOpacity="0.05"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <circle
                    cx="21"
                    cy="30"
                    r="2"
                    fill="currentColor"
                    fillOpacity="0.4"
                  />
                  {/* Upper Middle Node */}
                  <rect
                    x="44"
                    y="12"
                    width="12"
                    height="12"
                    rx="3"
                    fill="currentColor"
                    fillOpacity="0.05"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <circle
                    cx="50"
                    cy="18"
                    r="2"
                    fill="currentColor"
                    fillOpacity="0.4"
                  />
                  {/* Lower Middle Node */}
                  <rect
                    x="44"
                    y="36"
                    width="12"
                    height="12"
                    rx="3"
                    fill="currentColor"
                    fillOpacity="0.05"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <circle
                    cx="50"
                    cy="42"
                    r="2"
                    fill="currentColor"
                    fillOpacity="0.4"
                  />
                  {/* End Node */}
                  <rect
                    x="73"
                    y="24"
                    width="12"
                    height="12"
                    rx="3"
                    fill="currentColor"
                    fillOpacity="0.05"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <circle
                    cx="79"
                    cy="30"
                    r="2"
                    fill="currentColor"
                    fillOpacity="0.4"
                  />
                </svg>
              </div>
            </Link>
          </div>

          {/* Left Action Button (Image Upload) */}
          <div className="absolute left-2 top-2 z-10">
            <div className="relative">
              <button
                type="button"
                className="rounded-md bg-white/80 p-1 text-muted-foreground opacity-0 transition-all group-hover/card:opacity-100 hover:bg-white hover:text-foreground focus:opacity-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-black/50 dark:hover:bg-black/70 cursor-pointer"
                title="Change background image"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <input hidden accept="image/*" type="file" />

          {/* Right Action Button (Dropdown Menu) */}
          <div className="absolute right-2 top-2 z-10">
            <WorkflowActionsDropdown
              workflowId={workflow.id}
              workflowTitle={workflow.title}
              triggerClassName="rounded-md bg-white/80 p-1 text-muted-foreground opacity-0 transition-all group-hover/card:opacity-100 hover:bg-white hover:text-foreground focus:opacity-100 dark:bg-black/50 dark:hover:bg-black/70 cursor-pointer"
              handlers={{
                onOpen: (id) => router.push(`/workflows/${id}`),
                onRename: (id) => handleRename(id, workflow.title),
                onDelete: (id) => handleDelete(id, workflow.title),
              }}
            />
          </div>

          {/* Card Info */}
          <div className="mt-2 px-1">
            <div
              className="truncate text-sm font-semibold text-zinc-700"
              title={workflow.title}
            >
              {workflow.title}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {workflow.editedAt}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
