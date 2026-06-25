"use client";

import * as React from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Clock, ChevronDown, ChevronUp, Layers, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWorkflowRunsAction } from "../actions";

export interface NodeRunItem {
  id: string;
  nodeLabel: string;
  nodeType: string;
  status: "SUCCESS" | "FAILED" | "RUNNING" | "SKIPPED";
  duration: number;
  inputs?: any;
  output?: any;
  error?: string;
}

export interface WorkflowRunItem {
  id: string;
  runNumber: number;
  status: "SUCCESS" | "FAILED" | "PARTIAL" | "RUNNING";
  scope: "FULL" | "PARTIAL" | "SINGLE";
  duration: number;
  createdAt: string;
  nodeRuns: NodeRunItem[];
}

interface HistoryPanelProps {
  workflowId: string;
  onClose: () => void;
}

// Mock seed data matching the expected format from TEMP/po.md
const MOCK_RUNS: WorkflowRunItem[] = [
  {
    id: "run-123",
    runNumber: 123,
    status: "SUCCESS",
    scope: "FULL",
    duration: 77.1,
    createdAt: "Apr 25, 2026 3:45 PM",
    nodeRuns: [
      {
        id: "nr-1",
        nodeLabel: "Request-Inputs",
        nodeType: "requestInput",
        status: "SUCCESS",
        duration: 0.1,
        inputs: {},
        output: { text_field: "Product: Wireless Bluetooth Headphones...", image_field: "uploaded_photo.jpg" }
      },
      {
        id: "nr-2",
        nodeLabel: "Crop Image #1",
        nodeType: "cropImage",
        status: "SUCCESS",
        duration: 31.8,
        output: "https://cdn.transloadit.com/cropped_headphones_1.jpg"
      },
      {
        id: "nr-3",
        nodeLabel: "Crop Image #2",
        nodeType: "cropImage",
        status: "SUCCESS",
        duration: 32.1,
        output: "https://cdn.transloadit.com/cropped_headphones_2.jpg"
      },
      {
        id: "nr-4",
        nodeLabel: "Gemini #1",
        nodeType: "gemini",
        status: "SUCCESS",
        duration: 4.2,
        inputs: { Prompt: "Write a product description..." },
        output: "Introducing our premium wireless bluetooth headphones..."
      },
      {
        id: "nr-5",
        nodeLabel: "Gemini #2",
        nodeType: "gemini",
        status: "SUCCESS",
        duration: 3.9,
        inputs: { Prompt: "Condense this description..." },
        output: "Silence the world. 30 hrs battery. Premium sound."
      },
      {
        id: "nr-6",
        nodeLabel: "Final Gemini",
        nodeType: "gemini",
        status: "SUCCESS",
        duration: 4.5,
        inputs: { Prompt: "Combine hook and crops..." },
        output: "Hear what matters. Silence the world. 30 hrs sound... [Image: Cropped 1] [Image: Cropped 2]"
      },
      {
        id: "nr-7",
        nodeLabel: "Response",
        nodeType: "response",
        status: "SUCCESS",
        duration: 0.1,
        output: "Final result captured."
      }
    ]
  },
  {
    id: "run-122",
    runNumber: 122,
    status: "FAILED",
    scope: "PARTIAL",
    duration: 35.8,
    createdAt: "Apr 25, 2026 2:10 PM",
    nodeRuns: [
      {
        id: "nr-8",
        nodeLabel: "Request-Inputs",
        nodeType: "requestInput",
        status: "SUCCESS",
        duration: 0.1,
        output: { text_field: "Product: Wireless Bluetooth Headphones..." }
      },
      {
        id: "nr-9",
        nodeLabel: "Crop Image #1",
        nodeType: "cropImage",
        status: "SUCCESS",
        duration: 31.2,
        output: "https://cdn.transloadit.com/cropped_headphones_1.jpg"
      },
      {
        id: "nr-10",
        nodeLabel: "Gemini #1",
        nodeType: "gemini",
        status: "FAILED",
        duration: 4.5,
        error: "Google AI API quota limit reached. Please try again."
      },
      {
        id: "nr-11",
        nodeLabel: "Gemini #2",
        nodeType: "gemini",
        status: "SKIPPED",
        duration: 0
      }
    ]
  }
];

export function HistoryPanel({ workflowId, onClose }: HistoryPanelProps) {
  const [runs, setRuns] = React.useState<WorkflowRunItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedRunId, setExpandedRunId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout;

    const fetchRuns = async () => {
      try {
        const data = await getWorkflowRunsAction(workflowId);
        if (active) {
          setRuns(data as any);
          setLoading(false);

          // Poll every 1.5s if a run is running, otherwise every 3.5s
          const hasRunning = data.some(r => r.status === "RUNNING");
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
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />;
      case "FAILED":
        return <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
      case "RUNNING":
        return <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin flex-shrink-0" />;
      case "SKIPPED":
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed top-16 right-0 w-80 h-[calc(100vh-64px)] bg-white border-l border-zinc-200 shadow-xl z-40 flex flex-col font-sans text-zinc-800 animate-in slide-in-from-right duration-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50/50">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-xs tracking-wide uppercase text-zinc-700">Runs History</span>
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
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Loading history...</span>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="w-10 h-10 text-zinc-200 mb-2" />
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">No Runs Yet</span>
            <p className="text-xs text-zinc-400 max-w-[180px] mt-0.5">Run the workflow to see execution logs here</p>
          </div>
        ) : (
          runs.map((run) => {
            const isExpanded = expandedRunId === run.id;
            return (
              <div
                key={run.id}
                className={cn(
                  "border border-zinc-200/80 rounded-xl transition-all duration-200 overflow-hidden bg-white shadow-2xs hover:border-zinc-300",
                  isExpanded && "border-purple-300/80 ring-2 ring-purple-100"
                )}
              >
                {/* Run Card Header (clickable to expand) */}
                <button
                  onClick={() => toggleExpand(run.id)}
                  className="w-full text-left p-3.5 flex flex-col gap-2.5 hover:bg-zinc-50/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-zinc-700">
                      Run #{run.runNumber}
                    </span>
                    {getStatusBadge(run.status)}
                  </div>
                  
                  <div className="flex items-center justify-between w-full text-[10px] text-zinc-400 font-medium">
                    <span>{run.createdAt}</span>
                    <span className="flex items-center gap-2">
                      <span className="uppercase bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 font-semibold">{run.scope}</span>
                      <span className="font-semibold text-zinc-500 font-mono">{run.duration}s</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
                    </span>
                  </div>
                </button>

                {/* Expanded Node Runs Detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 bg-zinc-50/20 p-3.5 flex flex-col gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Node Executions</span>
                    <div className="flex flex-col gap-2.5">
                      {run.nodeRuns.map((node) => (
                        <div key={node.id} className="flex items-start gap-2.5 text-xs">
                          {getNodeStatusIcon(node.status)}
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <div className={cn(
                              "flex items-center justify-between w-full font-medium text-zinc-700",
                              node.status === "RUNNING" && "text-purple-600 font-semibold"
                            )}>
                              <span className="truncate">{node.nodeLabel}</span>
                              <span className="text-[10px] font-mono text-zinc-400 flex-shrink-0">
                                {node.status === "SKIPPED" ? "-" : node.status === "RUNNING" ? "Running..." : `${node.duration}s`}
                              </span>
                            </div>
                            
                            {/* Inputs / Output Preview if successful */}
                            {node.status === "SUCCESS" && node.output && (
                              <div className="bg-white border border-zinc-150 rounded-md p-1.5 mt-0.5 text-[10px] text-zinc-500 overflow-x-auto font-mono max-h-16 break-all">
                                {typeof node.output === "object" ? (
                                  node.output.response || node.output.url || JSON.stringify(node.output)
                                ) : (
                                  node.output
                                )}
                              </div>
                            )}

                            {/* Error display if failed */}
                            {node.status === "FAILED" && node.error && (
                              <div className="bg-red-50/50 border border-red-100 rounded-md p-1.5 mt-0.5 text-[10px] text-red-500 leading-relaxed">
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
