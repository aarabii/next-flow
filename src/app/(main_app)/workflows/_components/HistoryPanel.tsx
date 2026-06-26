"use client";

import * as React from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Layers,
  Loader2,
  Copy,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NodeRunItem {
  id: string;
  nodeId?: string;
  nodeLabel: string;
  nodeType: string;
  status: "SUCCESS" | "FAILED" | "RUNNING" | "SKIPPED";
  duration: number;
  inputs?: unknown;
  output?: unknown;
  error?: string;
  startedAtIso?: string | null;
}

export interface WorkflowRunItem {
  id: string;
  runNumber: number;
  status: "SUCCESS" | "FAILED" | "PARTIAL" | "RUNNING";
  scope: "FULL" | "PARTIAL" | "SINGLE";
  targetNodes?: string[];
  duration: number;
  createdAt: string;
  createdAtIso?: string;
  startedAtIso?: string | null;
  nodeRuns: NodeRunItem[];
}

interface HistoryPanelProps {
  workflowId: string;
  onClose: () => void;
}

export function HistoryPanel({ workflowId, onClose }: HistoryPanelProps) {
  const [runs, setRuns] = React.useState<WorkflowRunItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedRunId, setExpandedRunId] = React.useState<string | null>(null);
  const [timeOffset, setTimeOffset] = React.useState<number>(() => Date.now());

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
      window.open(url, "_blank");
    }
  };

  React.useEffect(() => {
    const hasRunning = runs.some((r) => r.status === "RUNNING");
    if (!hasRunning) return;

    const intervalId = setInterval(() => {
      setTimeOffset(Date.now());
    }, 100);

    return () => clearInterval(intervalId);
  }, [runs]);

  React.useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout;

    const fetchRuns = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}/runs`);
        if (!res.ok) {
          throw new Error("Failed to fetch runs");
        }
        const data = await res.json();

        if (active) {
          const runItems = data as WorkflowRunItem[];
          setRuns(runItems);
          setLoading(false);

          // Poll every 1.5s if a run is running, otherwise every 3.5s
          const hasRunning = runItems.some((r) => r.status === "RUNNING");
          if (hasRunning) {
            timerId = setTimeout(fetchRuns, 1500);
          } else {
            timerId = setTimeout(fetchRuns, 3500);
          }
        }
      } catch (err) {
        console.error("Failed to fetch runs:", err);
        if (active) {
          setLoading(false);
          timerId = setTimeout(fetchRuns, 5000);
        }
      }
    };

    fetchRuns();

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, [workflowId]);

  const toggleExpand = (runId: string) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  const getStatusBadge = (status: WorkflowRunItem["status"]) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="w-3 h-3" />
            <span>Success</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100">
            <XCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <AlertCircle className="w-3 h-3" />
            <span>Partial</span>
          </span>
        );
      case "RUNNING":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Running</span>
          </span>
        );
    }
  };

  const getNodeStatusIcon = (status: NodeRunItem["status"]) => {
    switch (status) {
      case "SUCCESS":
        return (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        );
      case "FAILED":
        return <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
      case "RUNNING":
        return (
          <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin flex-shrink-0" />
        );
      case "SKIPPED":
      default:
        return (
          <AlertCircle className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />
        );
    }
  };

  return (
    <div className="fixed top-16 right-0 w-80 h-[calc(100vh-64px)] bg-white border-l border-zinc-200 shadow-xl z-40 flex flex-col font-sans text-zinc-800 animate-in slide-in-from-right duration-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50/50">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-xs tracking-wide uppercase text-zinc-700">
            Runs History
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors text-zinc-400 hover:text-zinc-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Runs List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
        {loading && runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin mb-2" />
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Loading history...
            </span>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="w-10 h-10 text-zinc-200 mb-2" />
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              No Runs Yet
            </span>
            <p className="text-xs text-zinc-400 max-w-[180px] mt-0.5">
              Run the workflow to see execution logs here
            </p>
          </div>
        ) : (
          runs.map((run) => {
            const isExpanded = expandedRunId === run.id;
            return (
              <div
                key={run.id}
                className={cn(
                  "border border-zinc-200/80 rounded-xl transition-all duration-200 overflow-hidden bg-white shadow-2xs hover:border-zinc-300",
                  isExpanded && "border-purple-300/80 ring-2 ring-purple-100",
                )}
              >
                {/* Run Card Header (clickable to expand) */}
                <button
                  onClick={() => toggleExpand(run.id)}
                  className="w-full text-left p-3.5 flex flex-col gap-2.5 hover:bg-zinc-50/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className="text-xs font-bold text-zinc-700 block truncate max-w-[170px]"
                        title={run.id}
                      >
                        ID: {run.id.slice(0, 8)}...
                      </span>
                      <span className="text-[9px] font-semibold text-zinc-400 font-mono">
                        {run.scope === "SINGLE"
                          ? `Single Node: ${run.targetNodes?.[0] || "Unknown"}`
                          : run.scope === "PARTIAL"
                            ? "Partial Workflow"
                            : "Entire Workflow"}
                      </span>
                    </div>
                    {getStatusBadge(run.status)}
                  </div>

                  <div className="flex items-center justify-between w-full text-[10px] text-zinc-400 font-medium">
                    <span>{run.createdAt}</span>
                    <span className="flex items-center gap-2">
                      <span className="uppercase bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 font-semibold">
                        {run.scope}
                      </span>
                      <span className="font-semibold text-zinc-500 font-mono">
                        {run.status === "RUNNING"
                          ? run.startedAtIso
                            ? `${Math.max(0, (timeOffset - new Date(run.startedAtIso).getTime()) / 1000).toFixed(1)}s`
                            : "⏳"
                          : `${run.duration.toFixed(1)}s`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </span>
                  </div>
                </button>

                {/* Expanded Node Runs Detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 bg-zinc-50/20 p-3.5 flex flex-col gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Node Executions
                    </span>
                    <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {run.nodeRuns.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-start gap-2.5 text-xs"
                        >
                          {getNodeStatusIcon(node.status)}
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <div
                              className={cn(
                                "flex items-center justify-between w-full font-medium text-zinc-700",
                                node.status === "RUNNING" &&
                                  "text-purple-600 font-semibold",
                              )}
                            >
                              <span
                                className="truncate font-mono text-[10px] text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-150"
                                title={node.nodeLabel}
                              >
                                {node.nodeId || node.id}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 flex-shrink-0">
                                {node.status === "SKIPPED"
                                  ? "-"
                                  : node.status === "RUNNING"
                                    ? node.startedAtIso
                                      ? `${Math.max(0, (timeOffset - new Date(node.startedAtIso).getTime()) / 1000).toFixed(1)}s`
                                      : "Running..."
                                    : `${node.duration}s`}
                              </span>
                            </div>

                            {/* Inputs / Output Preview if successful */}
                            {node.status === "SUCCESS" &&
                              !!node.output &&
                              (() => {
                                const outputObj = node.output as
                                  | Record<string, unknown>
                                  | null
                                  | undefined;
                                const value =
                                  outputObj && typeof outputObj === "object"
                                    ? (outputObj.response as string) ||
                                      (outputObj.url as string) ||
                                      JSON.stringify(outputObj)
                                    : String(node.output);
                                const isMedia =
                                  typeof value === "string" &&
                                  (value.startsWith("http://") ||
                                    value.startsWith("https://") ||
                                    value.startsWith("data:") ||
                                    value.startsWith("blob:")) &&
                                  (/\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|mp3|wav|ogg)$/i.test(
                                    value,
                                  ) ||
                                    value.includes("transloadit") ||
                                    value.includes("picsum") ||
                                    node.nodeType === "imageNode" ||
                                    node.nodeType === "cropImage" ||
                                    node.nodeType === "videoNode" ||
                                    node.nodeType === "audioNode");

                                return (
                                  <div className="flex flex-col gap-1.5 mt-1 bg-white border border-zinc-200/60 rounded-lg p-2 shadow-3xs">
                                    <div className="text-[10px] text-zinc-500 font-mono max-h-36 overflow-y-auto break-all whitespace-pre-wrap select-all pr-1">
                                      {value}
                                    </div>
                                    <div className="flex justify-end gap-1.5 border-t border-zinc-100 pt-1.5">
                                      {isMedia ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(
                                              value,
                                              `download-${node.nodeId || node.id}`,
                                            );
                                          }}
                                          className="px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-[9px] font-semibold text-zinc-600 hover:bg-zinc-100 flex items-center gap-1 cursor-pointer"
                                        >
                                          <Download className="w-2.5 h-2.5" />
                                          <span>Download</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(
                                              value,
                                            );
                                            alert("Copied to clipboard!");
                                          }}
                                          className="px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-[9px] font-semibold text-zinc-600 hover:bg-zinc-100 flex items-center gap-1 cursor-pointer"
                                        >
                                          <Copy className="w-2.5 h-2.5" />
                                          <span>Copy</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                            {/* Error display if failed */}
                            {node.status === "FAILED" && node.error && (
                              <div className="bg-red-50/50 border border-red-100 rounded-md p-1.5 mt-0.5 text-[10px] text-red-500 leading-relaxed max-h-24 overflow-y-auto break-all pr-1">
                                {node.error}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
