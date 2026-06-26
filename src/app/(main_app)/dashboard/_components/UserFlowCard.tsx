"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Search } from "lucide-react";
import { WorkflowActionsDropdown } from "./WorkflowActionsDropdown";
import { useDashboardStore } from "@/hooks/useDashboardStore";

interface UserWorkflow {
  id: string;
  title: string;
  href: string;
  editedAt: string;
  gradient: string;
  backgroundImage?: string | null;
}

interface UserFlowCardProps {
  initialWorkflows: UserWorkflow[];
  workflows: UserWorkflow[];
}

export const UserFlowCard = ({
  initialWorkflows,
  workflows,
}: UserFlowCardProps) => {
  const router = useRouter();
  const { uploadingIds, setUploadingId } = useDashboardStore();
  const [editingWorkflowId, setEditingWorkflowId] = React.useState<string | null>(null);
  const [editingWorkflowName, setEditingWorkflowName] = React.useState("");
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>(
    {},
  );

  const startEditingRename = (id: string, currentTitle: string) => {
    setEditingWorkflowId(id);
    setEditingWorkflowName(currentTitle);
  };

  const cancelEditingRename = () => {
    setEditingWorkflowId(null);
    setEditingWorkflowName("");
  };

  const handleRename = async (id: string, currentTitle: string, nextTitle: string) => {
    const newName = nextTitle.trim();
    if (!newName || newName === currentTitle) {
      cancelEditingRename();
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename workflow");
      }

      cancelEditingRename();
      router.refresh();
    } catch (err) {
      alert(
        `Error renaming workflow: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete workflow");
      }

      router.refresh();
    } catch (err) {
      alert(
        `Error deleting workflow: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleImageUpload = async (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingId(id, true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Transloadit image upload endpoint
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      if (data.url) {
        const updateResponse = await fetch(`/api/workflows/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ backgroundImage: data.url }),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to save workflow background image");
        }

        router.refresh();
      }
    } catch (err) {
      alert(
        `Error uploading image: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setUploadingId(id, false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  if (initialWorkflows.length === 0) {
    return (
      <div className="mt-space-06 flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-2xl py-12 px-4 text-center bg-zinc-50/20 max-w-xl">
        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-200/50">
          <ImagePlus className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
          No Workflows
        </div>
        <p className="text-xs text-zinc-400 max-w-70">
          Create a new workflow to get started on the visual canvas.
        </p>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="mt-space-06 flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-2xl py-12 px-4 text-center bg-zinc-50/20 max-w-xl">
        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-200/50">
          <Search className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
          No matches found
        </div>
        <p className="text-xs text-zinc-400 max-w-70">
          We couldn&apos;t find any workflows matching your search query.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-space-06 grid grid-cols-1 gap-space-07 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {workflows.map((workflow) => (
        <div key={workflow.id} className="group/card relative max-w-62 w-full">
          <div className="relative overflow-hidden rounded-xl border border-border shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md bg-white">
            <Link
              className="block aspect-250/162 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[12px_12px] overflow-hidden relative"
              href={workflow.href}
            >
              {workflow.backgroundImage ? (
                <>
                  <img
                    src={workflow.backgroundImage}
                    alt={workflow.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 transition-opacity group-hover/card:bg-black/20" />
                </>
              ) : (
                <>
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${workflow.gradient} opacity-50`}
                  />

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-75">
                    <svg
                      className="w-full h-full text-foreground/20"
                      viewBox="0 0 100 60"
                      fill="none"
                    >
                      <path
                        d="M25 30 L50 18 M25 30 L50 42 M50 18 L75 30 M50 42 L75 30"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
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
                </>
              )}
            </Link>
          </div>

          {/* Left Action Button (Image Upload) */}
          <div className="absolute left-2 top-2 z-10">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRefs.current[workflow.id]?.click()}
                disabled={uploadingIds[workflow.id]}
                className="rounded-md bg-white/80 p-1 text-muted-foreground opacity-0 transition-all group-hover/card:opacity-100 hover:bg-white hover:text-foreground focus:opacity-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-black/50 dark:hover:bg-black/70 cursor-pointer flex items-center justify-center"
                title="Change background image"
              >
                {uploadingIds[workflow.id] ? (
                  <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ImagePlus className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <input
            ref={(el) => {
              fileInputRefs.current[workflow.id] = el;
            }}
            hidden
            accept="image/*"
            type="file"
            onChange={(e) => handleImageUpload(workflow.id, e)}
          />

          {/* Right Action Button (Dropdown Menu) */}
          <div className="absolute right-2 top-2 z-10">
            <WorkflowActionsDropdown
              workflowId={workflow.id}
              workflowTitle={workflow.title}
              triggerClassName="rounded-md bg-white/80 p-1 text-muted-foreground opacity-0 transition-all group-hover/card:opacity-100 hover:bg-white hover:text-foreground focus:opacity-100 dark:bg-black/50 dark:hover:bg-black/70 cursor-pointer"
              handlers={{
                onOpen: (id) => router.push(`/workflows/${id}`),
                onRename: (id) => startEditingRename(id, workflow.title),
                onDelete: (id) => handleDelete(id, workflow.title),
              }}
            />
          </div>

          {/* Card Info */}
          <div className="mt-2 px-1">
            {editingWorkflowId === workflow.id ? (
              <input
                type="text"
                value={editingWorkflowName}
                onChange={(e) => setEditingWorkflowName(e.target.value)}
                onBlur={() => handleRename(workflow.id, workflow.title, editingWorkflowName)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename(workflow.id, workflow.title, editingWorkflowName);
                  } else if (e.key === "Escape") {
                    cancelEditingRename();
                  }
                }}
                className="w-full rounded-md border border-purple-500 bg-white px-2 py-1 text-sm font-semibold text-zinc-800 outline-hidden focus:ring-2 focus:ring-purple-500/20"
                autoFocus
              />
            ) : (
              <div
                className="truncate text-sm font-semibold text-zinc-700 cursor-text font-secondary"
                title={workflow.title}
                onDoubleClick={() => startEditingRename(workflow.id, workflow.title)}
              >
                {workflow.title}
              </div>
            )}
            <div className="mt-0.5 text-xs text-muted-foreground">
              {workflow.editedAt}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
