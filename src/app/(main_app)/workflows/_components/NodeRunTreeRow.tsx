"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  ClipboardList,
  Crop,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";
import { NodeRunItem } from "./HistoryPanel";
import { DetailsAccordion } from "./DetailsAccordion";
import { NodeOutputRenderer } from "./NodeOutputRenderer";
import { cn } from "@/lib/utils";

interface NodeRunTreeRowProps {
  node: NodeRunItem;
  displayName: string;
  timeOffset: number;
}

const getNodeIcon = (nodeType: string) => {
  switch (nodeType) {
    case "requestInput":
      return <ClipboardList className="w-4 h-4 text-zinc-650" />;
    case "cropImage":
      return <Crop className="w-4 h-4 text-zinc-650" />;
    case "textNode":
      return <Sparkles className="w-4 h-4 text-zinc-650" />;
    case "response":
    default:
      return <ClipboardCheck className="w-4 h-4 text-zinc-650" />;
  }
};

export function NodeRunTreeRow({
  node,
  displayName,
  timeOffset,
}: NodeRunTreeRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isInputOpen, setIsInputOpen] = React.useState(true);
  const [isOutputOpen, setIsOutputOpen] = React.useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(true);

  // Status badges
  let statusBadge = (
    <span className="w-4 h-4 rounded-full border border-zinc-200 bg-zinc-100 flex items-center justify-center shrink-0">
      <Clock className="w-2.5 h-2.5 text-zinc-400" />
    </span>
  );

  if (node.status === "SUCCESS") {
    statusBadge = (
      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-50" />
    );
  } else if (node.status === "FAILED") {
    statusBadge = (
      <XCircle className="w-4 h-4 text-rose-500 shrink-0 fill-rose-50" />
    );
  } else if (node.status === "RUNNING") {
    statusBadge = (
      <Loader2 className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
    );
  } else if (node.status === "SKIPPED") {
    statusBadge = (
      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 fill-amber-50" />
    );
  }

  // Duration
  const durationStr =
    node.status === "RUNNING"
      ? node.startedAtIso
        ? `${Math.max(0, (timeOffset - new Date(node.startedAtIso).getTime()) / 1000).toFixed(1)}s`
        : "Running..."
      : `${node.duration.toFixed(1)}s`;

  // Subtext under node name
  let detailsText = "";
  if (node.status === "FAILED") {
    detailsText = node.error ? `Error: ${node.error}` : "Failed";
  } else if (node.status === "SKIPPED") {
    detailsText = "Skipped";
  } else if (node.nodeType === "requestInput") {
    const fields = (node.output as { fields?: { label: string }[] })?.fields || [];
    detailsText =
      fields
        .map((f) => f.label.replace(/\s+/g, "_").toLowerCase())
        .join(", ") || "inputs";
  } else if (node.nodeType === "cropImage") {
    const url = (node.output as { url?: string })?.url || "";
    detailsText = url
      ? url.length > 25
        ? `${url.slice(0, 25)}...`
        : url
      : "image_output";
  } else if (node.nodeType === "textNode") {
    const responseText = (node.output as { response?: string })?.response || "";
    detailsText = responseText ? `"${responseText.slice(0, 20)}..."` : "text_output";
  } else if (node.nodeType === "response") {
    detailsText = "final result captured";
  }

  const inputsVal = node.inputs || {};
  const outputVal = node.output || {};

  return (
    <div className="flex flex-col gap-2">
      {/* Node Run Card row */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "relative flex items-center border border-zinc-200/80 rounded-xl p-3 bg-white shadow-2xs hover:border-zinc-300 transition-colors pl-14 select-none cursor-pointer text-left",
          isExpanded && "border-purple-300 ring-2 ring-purple-100/50 bg-purple-50/5"
        )}
      >
        {/* Absolute Icon Box positioned directly on the tree line */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center shrink-0 z-10 shadow-3xs">
          {getNodeIcon(node.nodeType)}
        </div>

        {/* Center metadata */}
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-[11px] font-bold text-zinc-700">{displayName}</h4>
          {detailsText && (
            <p className="text-[10px] text-zinc-400 font-mono truncate">
              {detailsText}
            </p>
          )}
        </div>

        {/* Right side check status & duration */}
        <div className="flex items-center gap-2 shrink-0">
          {statusBadge}
          <span className="text-[10px] font-mono font-semibold text-zinc-500 bg-zinc-100/85 px-1.5 py-0.5 rounded border border-zinc-200/50">
            {durationStr}
          </span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-zinc-400 transition-transform",
              isExpanded && "rotate-180 text-purple-600"
            )}
          />
        </div>
      </div>

      {/* Expanded Vertically Inline Node Details Card */}
      {isExpanded && (
        <div className="ml-6 mb-3 p-3.5 bg-zinc-50/50 border border-zinc-200 rounded-xl flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-1.5 duration-200">
          {/* Node metadata info */}
          <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono select-all text-left">
            <span>Node ID: {node.nodeId || "Unknown"}</span>
            <span>Run: {node.id.slice(0, 8)}...</span>
          </div>

          {/* Accordion fields */}
          <div className="flex flex-col gap-3">
            {/* Input Accordion (Hidden for Response node) */}
            {node.nodeType !== "response" && (
              <DetailsAccordion
                title="Input"
                isOpen={isInputOpen}
                onToggle={() => setIsInputOpen(!isInputOpen)}
                onCopy={() => {
                  const valToCopy = node.nodeType === "requestInput" ? outputVal : inputsVal;
                  navigator.clipboard.writeText(JSON.stringify(valToCopy, null, 2));
                }}
              >
                <pre className="bg-zinc-50/50 border border-zinc-150 rounded-lg p-3 text-[10px] text-zinc-650 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto text-left leading-relaxed">
                  {JSON.stringify(node.nodeType === "requestInput" ? outputVal : inputsVal, null, 2)}
                </pre>
              </DetailsAccordion>
            )}

            {/* Output Accordion (Hidden for Request Input node) */}
            {node.nodeType !== "requestInput" && (
              <DetailsAccordion
                title="Output"
                isOpen={isOutputOpen}
                onToggle={() => setIsOutputOpen(!isOutputOpen)}
                onCopy={() => {
                  const valToCopy = node.nodeType === "response" ? inputsVal : outputVal;
                  navigator.clipboard.writeText(JSON.stringify(valToCopy, null, 2));
                }}
              >
                <div className="flex flex-col gap-3">
                  {node.nodeType === "response" ? (
                    <pre className="bg-zinc-50/50 border border-zinc-150 rounded-lg p-3 text-[10px] text-zinc-655 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto text-left leading-relaxed">
                      {JSON.stringify(inputsVal, null, 2)}
                    </pre>
                  ) : (
                    <NodeOutputRenderer node={node} />
                  )}
                </div>
              </DetailsAccordion>
            )}

            {/* Details Accordion (Hidden for Request Input and Response nodes) */}
            {node.nodeType !== "requestInput" && node.nodeType !== "response" && (
              <DetailsAccordion
                title="Details"
                isOpen={isDetailsOpen}
                onToggle={() => setIsDetailsOpen(!isDetailsOpen)}
              >
                <div className="flex flex-col gap-2 text-xs text-zinc-650 font-medium text-left">
                  {node.nodeType === "textNode" && (
                    <>
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                        <span className="text-zinc-400 text-[10px]">Tokens Used</span>
                        <span className="font-semibold text-zinc-700">
                          {(outputVal as { usage?: { total_tokens?: number } })?.usage?.total_tokens ?? "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                        <span className="text-zinc-400 text-[10px]">Model</span>
                        <span className="font-semibold text-zinc-700">
                          {(inputsVal as { model?: string })?.model ?? "N/A"}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                    <span className="text-zinc-400 text-[10px]">Node Type</span>
                    <span className="font-semibold text-zinc-700">
                      {node.nodeType === "cropImage"
                        ? "Image Crop"
                        : node.nodeType === "textNode"
                          ? "Text Generator"
                          : node.nodeType}
                    </span>
                  </div>
                  {node.startedAtIso && (
                    <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                      <span className="text-zinc-400 text-[10px]">Started At</span>
                      <span className="font-semibold text-zinc-700">
                        {new Date(node.startedAtIso).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                    <span className="text-zinc-400 text-[10px]">Duration</span>
                    <span className="font-semibold text-zinc-700">
                      {node.duration ? `${node.duration.toFixed(1)}s` : "0.0s"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                    <span className="text-zinc-400 text-[10px]">Execution ID</span>
                    <span className="font-mono text-[9px] text-zinc-500 select-all">
                      {node.id}
                    </span>
                  </div>
                  {node.error && (
                    <div className="flex flex-col gap-1 pt-1.5">
                      <span className="text-rose-600 text-[10px] font-semibold">Error Details</span>
                      <pre className="bg-rose-50/50 border border-rose-150 rounded-lg p-2.5 text-[9px] text-rose-700 font-mono whitespace-pre-wrap leading-relaxed text-left">
                        {node.error}
                      </pre>
                    </div>
                  )}
                </div>
              </DetailsAccordion>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
