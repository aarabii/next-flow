"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  ChevronDown,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { WorkflowRunItem } from "./HistoryPanel";
import { NodeRunTreeRow } from "./NodeRunTreeRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkflowRunCardProps {
  run: WorkflowRunItem;
  timeOffset: number;
  defaultExpanded?: boolean;
}

export function WorkflowRunCard({
  run,
  timeOffset,
  defaultExpanded = false,
}: WorkflowRunCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const onToggle = () => setIsExpanded(!isExpanded);
  // Status summary numbers
  const totalNodes = run.nodeRuns.length;
  const failedNodes = run.nodeRuns.filter((n) => n.status === "FAILED").length;

  const getStatusBadge = (status: WorkflowRunItem["status"]) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Success</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Failed</span>
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Partial</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-50 text-zinc-600 border border-zinc-200">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>Waiting</span>
          </span>
        );
      case "RUNNING":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-600" />
            <span>Running</span>
          </span>
        );
    }
  };

  // Download Logs handler
  const handleDownloadLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const jsonStr = JSON.stringify(run, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `workflow-run-${run.runNumber}-${run.id.slice(0, 8)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download logs:", err);
    }
  };

  // Generate node display names mapping
  const counts: Record<string, number> = {};
  const displayNames = run.nodeRuns.map((node) => ({
    nodeId: node.id,
    name: getDisplayName(node, counts),
  }));

  function getDisplayName(node: import("./HistoryPanel").NodeRunItem, counts: Record<string, number>) {
    const type = node.nodeType;
    counts[type] = (counts[type] || 0) + 1;

    if (node.nodeLabel.includes("Final")) {
      return node.nodeLabel;
    }

    if (type === "cropImage") return `Crop Image #${counts[type]}`;
    if (type === "textNode") return `Gemini #${counts[type]}`;
    if (type === "requestInput") return "Request-Inputs";
    if (type === "response") return "Response";

    return node.nodeLabel;
  }

  return (
    <div
      className={cn(
        "border border-zinc-200/80 rounded-xl transition-all duration-200 bg-white shadow-2xs hover:border-zinc-300 select-none",
        isExpanded && "border-purple-300 ring-2 ring-purple-100/50"
      )}
    >
      {/* Run Card Header button */}
      <button
        onClick={onToggle}
        type="button"
        className="w-full text-left p-3.5 flex flex-col gap-3 hover:bg-zinc-50/20 cursor-pointer transition-colors rounded-xl"
      >
        {/* Top row: Run #number and status badge, type badge */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-zinc-800">
              Run #{run.runNumber}
            </span>
            {getStatusBadge(run.status)}
          </div>
          <span className="px-2 py-0.5 rounded-md border border-zinc-200 bg-zinc-50 font-bold text-[8px] text-zinc-500 uppercase tracking-wide">
            {run.scope === "FULL" ? "Full Run" : "Node Run"}
          </span>
        </div>

        {/* Bottom row: date/time (left), duration + chevron (right) */}
        <div className="flex items-center justify-between w-full text-[10px] font-medium text-zinc-500">
          {/* Calendar float badge (Left Corner) */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-zinc-200 bg-zinc-50/50 shadow-3xs truncate">
            <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="text-[9px] truncate">{run.createdAt}</span>
          </div>

          {/* Duration float badge + Chevron (Right Corner) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border shadow-3xs font-mono",
              run.status === "SUCCESS" && "bg-emerald-50 text-emerald-700 border-emerald-200",
              run.status === "FAILED" && "bg-rose-55 text-rose-700 border-rose-200",
              run.status === "PARTIAL" && "bg-amber-50 text-amber-700 border-amber-200",
              run.status === "RUNNING" && "bg-blue-50 text-blue-700 border-blue-200 animate-pulse",
              run.status === "PENDING" && "bg-zinc-50 text-zinc-500 border-zinc-200"
            )}>
              <Clock className="w-3 h-3 shrink-0 opacity-80" />
              <span className="text-[9px] font-bold">
                {run.status === "RUNNING"
                  ? run.startedAtIso
                    ? `${Math.max(0, (timeOffset - new Date(run.startedAtIso).getTime()) / 1000).toFixed(0)}s`
                    : "⏳"
                  : run.status === "PENDING"
                    ? "Waiting"
                    : `${run.duration.toFixed(0)}s`}
              </span>
            </div>

            <ChevronDown
              className={cn(
                "w-4 h-4 text-zinc-400 shrink-0 transition-transform",
                isExpanded && "rotate-180 text-purple-600"
              )}
            />
          </div>
        </div>
      </button>

      {/* Expanded Node execution tree */}
      {isExpanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/15 p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-1.5 duration-200">
          
          {/* Action Row: Download logs */}
          <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono text-left select-all">
            <span>ID: {run.id}</span>
            <Button
              variant="outline"
              size="xs"
              type="button"
              onClick={handleDownloadLogs}
              className="text-[9px] font-bold border-zinc-200 hover:bg-zinc-50 cursor-pointer h-5 px-2 rounded-md"
            >
              <Download className="w-2.5 h-2.5" />
              <span>Download Logs</span>
            </Button>
          </div>

          {/* Status summary block */}
          <div className="grid grid-cols-3 border border-zinc-200/80 rounded-xl p-3 bg-white shadow-3xs text-center">
            <div className="flex flex-col gap-1 border-r border-zinc-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Status
              </span>
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-zinc-700">
                {run.status === "SUCCESS" && (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-50" />
                    <span>Success</span>
                  </>
                )}
                {run.status === "FAILED" && (
                  <>
                    <XCircle className="w-3 h-3 text-rose-500 fill-rose-50" />
                    <span>Failed</span>
                  </>
                )}
                {run.status === "PARTIAL" && (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 fill-amber-50" />
                    <span>Partial</span>
                  </>
                )}
                {run.status === "RUNNING" && (
                  <>
                    <Loader2 className="w-3 h-3 text-purple-650 animate-spin" />
                    <span>Running</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 border-r border-zinc-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Total Nodes
              </span>
              <span className="text-[11px] font-bold text-zinc-700">{totalNodes}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Failed Nodes
              </span>
              <span
                className={cn(
                  "text-[11px] font-bold",
                  failedNodes > 0 ? "text-rose-600" : "text-zinc-700"
                )}
              >
                {failedNodes}
              </span>
            </div>
          </div>

          {/* Tree list of execution nodes */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 text-left">
              Execution Tree
            </span>

            <div className="relative pl-0 py-1.5">
              {/* Connected Vertical tree line */}
              <div className="absolute left-[31px] top-6 bottom-6 w-[2px] bg-zinc-150" />

              <div className="flex flex-col gap-3">
                {run.nodeRuns.map((node, index) => {
                  const displayName = displayNames[index]?.name || node.nodeLabel;
                  return (
                    <NodeRunTreeRow
                      key={node.id}
                      node={node}
                      displayName={displayName}
                      timeOffset={timeOffset}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Helper status text */}
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-zinc-400 font-medium border-t border-zinc-100 pt-3 select-none">
            {run.status === "SUCCESS" ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-zinc-450 fill-zinc-50" />
                <span>All nodes executed successfully</span>
              </>
            ) : run.status === "FAILED" ? (
              <>
                <XCircle className="w-3 h-3 text-rose-455 fill-rose-50" />
                <span>Workflow execution failed</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-zinc-455 fill-zinc-50" />
                <span>Workflow runs complete</span>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
