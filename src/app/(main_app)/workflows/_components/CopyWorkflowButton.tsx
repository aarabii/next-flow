"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import type { Node, Edge } from "@xyflow/react";

interface CopyWorkflowButtonProps {
  workflowName: string;
  nodes: Node[];
  edges: Edge[];
  className?: string;
  variant?: "default" | "icon";
}

export function CopyWorkflowButton({
  workflowName,
  nodes,
  edges,
  className,
  variant = "default",
}: CopyWorkflowButtonProps) {
  const router = useRouter();
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyWorkflow = async () => {
    if (isCopying) return;
    setIsCopying(true);
    try {
      const response = await fetch("/api/workflows/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${workflowName} (Copy)`,
          nodes,
          edges,
        }),
      });
      if (!response.ok) throw new Error("Failed to copy workflow");
      const data = await response.json();
      router.push(`/workflows/${data.id}`);
    } catch (error) {
      console.error("Copy workflow error:", error);
      alert("Failed to copy workflow");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <button
      onClick={handleCopyWorkflow}
      disabled={isCopying}
      className={cn(
        variant === "icon"
          ? "p-2 hover:bg-zinc-50 rounded-lg text-zinc-650 hover:text-purple-600 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          : "px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {isCopying ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {variant !== "icon" && <span className="hidden sm:inline">Copy</span>}
    </button>
  );
}
