"use client";

import * as React from "react";
import { Clock, X, Loader2, Layers, Filter } from "lucide-react";
import { WorkflowRunCard } from "./WorkflowRunCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export interface NodeRunItem {
  id: string;
  nodeId?: string;
  nodeLabel: string;
  nodeType: string;
  status: "SUCCESS" | "FAILED" | "RUNNING" | "SKIPPED" | "PENDING";
  duration: number;
  inputs?: unknown;
  output?: unknown;
  error?: string;
  startedAtIso?: string | null;
}

export interface WorkflowRunItem {
  id: string;
  runNumber: number;
  status: "SUCCESS" | "FAILED" | "PARTIAL" | "RUNNING" | "PENDING";
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

type StatusFilter = "ALL" | "RUNNING" | "PENDING" | "COMPLETED" | "FAILED";

export function HistoryPanel({ workflowId, onClose }: HistoryPanelProps) {
  const [runs, setRuns] = React.useState<WorkflowRunItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [timeOffset, setTimeOffset] = React.useState<number>(() => Date.now());
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");

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

  const filteredRuns = runs.filter((run) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "RUNNING") return run.status === "RUNNING";
    if (statusFilter === "PENDING") return run.status === "PENDING";
    if (statusFilter === "COMPLETED") return run.status === "SUCCESS" || run.status === "PARTIAL";
    if (statusFilter === "FAILED") return run.status === "FAILED";
    return true;
  });

  return (
    <div className="fixed top-0 md:top-16 right-0 w-full sm:w-[380px] h-full md:h-[calc(100vh-64px)] bg-white border-l border-zinc-200 shadow-xl z-50 md:z-40 flex flex-col font-sans text-zinc-800 animate-in slide-in-from-right duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50/50 shrink-0">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-xs tracking-wide uppercase text-zinc-700">
            Run History
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className={cn(
                  "text-zinc-400 rounded hover:text-zinc-600 cursor-pointer",
                  statusFilter !== "ALL" && "text-purple-655 bg-purple-50 hover:bg-purple-100"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white border border-zinc-200 rounded-xl shadow-md p-1">
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as StatusFilter)}
              >
                <DropdownMenuRadioItem value="ALL" className="text-xs cursor-pointer rounded-lg px-2 py-1.5 hover:bg-zinc-50">
                  All
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="RUNNING" className="text-xs cursor-pointer rounded-lg px-2 py-1.5 hover:bg-zinc-50">
                  Running
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PENDING" className="text-xs cursor-pointer rounded-lg px-2 py-1.5 hover:bg-zinc-50">
                  Waiting
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="COMPLETED" className="text-xs cursor-pointer rounded-lg px-2 py-1.5 hover:bg-zinc-50">
                  Completed
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="FAILED" className="text-xs cursor-pointer rounded-lg px-2 py-1.5 hover:bg-zinc-50">
                  Failed
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon-xs" onClick={onClose} className="text-zinc-400 rounded hover:text-zinc-600 cursor-pointer">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-8 flex flex-col gap-3.5 bg-zinc-50/5">
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
            <p className="text-xs text-zinc-400 max-w-45 mt-0.5">
              Run the workflow to see execution logs here
            </p>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="w-8 h-8 text-zinc-350 mb-2" />
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              No Matching Runs
            </span>
            <p className="text-xs text-zinc-400 max-w-48 mt-0.5">
              No runs match the selected status filter
            </p>
          </div>
        ) : (
          filteredRuns.map((run, index) => (
            <WorkflowRunCard
              key={run.id}
              run={run}
              timeOffset={timeOffset}
              defaultExpanded={index === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
