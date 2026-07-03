"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { NodeRunItem } from "./HistoryPanel";
import { cn } from "@/lib/utils";

interface NodeOutputRendererProps {
  node: NodeRunItem;
}

export function NodeOutputRenderer({ node }: NodeOutputRendererProps) {
  const [showFull, setShowFull] = React.useState(false);
  const outputObj = node.output as Record<string, unknown> | null | undefined;
  const value =
    outputObj && typeof outputObj === "object"
      ? (outputObj.response as string) ||
        (outputObj.url as string) ||
        JSON.stringify(outputObj, null, 2)
      : String(node.output || "");

  const isMedia =
    typeof value === "string" &&
    (value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:") ||
      value.startsWith("blob:")) &&
    (/\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|mp3|wav|ogg)$/i.test(value) ||
      value.includes("transloadit") ||
      value.includes("picsum") ||
      node.nodeType === "cropImage");

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(value);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `download-${node.nodeId || node.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
      window.open(value, "_blank");
    }
  };

  if (isMedia) {
    const isAudio =
      value.endsWith(".mp3") ||
      value.endsWith(".wav") ||
      value.endsWith(".ogg") ||
      value.includes("/audio");

    return (
      <div className="flex flex-col gap-2 bg-white border border-zinc-150 rounded p-2">
        <div className="w-full h-24 rounded border border-zinc-100 bg-zinc-50 shrink-0 overflow-hidden flex items-center justify-center relative">
          {isAudio ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-zinc-500 font-semibold">Audio Output</span>
              <audio controls src={value} className="h-6 w-full max-w-[200px]" />
            </div>
          ) : (
            <img
              src={value}
              alt="Node Output"
              className="object-contain w-full h-full max-h-24"
            />
          )}
        </div>
        <div className="flex justify-end pt-1 border-t border-zinc-100">
          <button
            onClick={handleDownload}
            type="button"
            className="px-2 py-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded text-[9px] font-semibold text-zinc-650 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Download className="w-2.5 h-2.5" />
            <span>Download Output</span>
          </button>
        </div>
      </div>
    );
  }

  const isLong = value.length > 250 || value.split("\n").length > 6;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className={cn(
        "relative rounded-lg overflow-hidden border border-zinc-150 bg-zinc-50/30 transition-all duration-300",
        isLong && !showFull ? "max-h-32" : "max-h-none"
      )}>
        <pre className="p-3 text-[10px] text-zinc-650 font-mono whitespace-pre-wrap text-left leading-relaxed overflow-x-auto">
          {value}
        </pre>
        {isLong && !showFull && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-zinc-50/90 to-transparent pointer-events-none" />
        )}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setShowFull(!showFull)}
          className="text-[9px] font-bold text-purple-600 hover:text-purple-700 hover:underline transition-colors self-start cursor-pointer select-none"
        >
          {showFull ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
}
