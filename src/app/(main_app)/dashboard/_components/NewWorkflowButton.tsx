"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function NewWorkflowButton() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setIsPending(true);
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow");
      }

      const data = await response.json();
      router.push(`/workflows/${data.id}`);
    } catch (error) {
      console.error("Error creating workflow:", error);
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleCreate}>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-9 w-9 items-center justify-center rounded-radius-l bg-surface-on-action text-icon-on-action transition-colors hover:opacity-90 disabled:opacity-40 cursor-pointer"
        title="Create a new workflow"
        aria-label="New workflow"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </button>
    </form>
  );
}
