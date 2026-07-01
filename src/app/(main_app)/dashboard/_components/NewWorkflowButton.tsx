"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
      <Button
        type="submit"
        disabled={isPending}
        size="icon"
        className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white border-0"
        title="Create a new workflow"
        aria-label="New workflow"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
