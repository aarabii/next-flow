"use client";

import * as React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Trash2, Download, HelpCircle, FileText, Image as ImageIcon, Video as VideoIcon, Music as MusicIcon, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponseNodeData, ResponseResultItem } from "@/types/node.type";
import { NodeWrapper } from "./NodeWrapper";
import ReactMarkdown from "react-markdown";

export function ResponseNode({ id, data }: NodeProps<Node<ResponseNodeData>>) {
  const results = data.results || [];

  const handleDelete = (edgeId: string) => {
    if (data.onDeleteConnection) {
      data.onDeleteConnection(edgeId);
    }
  };

  const detectType = (item: ResponseResultItem): "image" | "video" | "audio" | "text" => {
    if (item.type) return item.type;
    const val = item.value || "";
    if (val.startsWith("data:image/") || val.startsWith("blob:") || /\.(jpg|jpeg|png|webp|gif)$/i.test(val)) {
      return "image";
    }
    if (val.startsWith("data:video/") || /\.(mp4|webm|mov)$/i.test(val)) {
      return "video";
    }
    if (val.startsWith("data:audio/") || /\.(mp3|wav|ogg)$/i.test(val)) {
      return "audio";
    }
    if (item.sourceHandleId === "outputImage" || item.sourceHandleId === "image_field") {
      return "image";
    }
    return "text";
  };

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

  const headerRight = (
    <button className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400">
      <HelpCircle className="w-4 h-4" />
    </button>
  );

  return (
    <NodeWrapper
      id={id}
      title="Response"
      headerRightExtra={headerRight}
    >
      {/* Target Handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        id="result"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
      />

      <div className="flex flex-col gap-3 min-h-[100px]">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-xl py-8 px-4 text-center bg-zinc-50/20 h-full">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Result Area</span>
            <p className="text-xs text-zinc-400">Connect output nodes to collect results here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
            {results.map((item) => {
              const type = detectType(item);
              return (
                <div
                  key={item.edgeId}
                  className="border border-zinc-200 rounded-xl p-3 bg-white hover:border-zinc-300 transition-all shadow-xs flex flex-col gap-2 group/result"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-zinc-50 pb-1.5">
                    <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      {type === "image" && <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
                      {type === "video" && <VideoIcon className="w-3.5 h-3.5 text-blue-500" />}
                      {type === "audio" && <MusicIcon className="w-3.5 h-3.5 text-blue-500" />}
                      {type === "text" && <FileText className="w-3.5 h-3.5 text-amber-500" />}
                      {item.label}
                    </span>
                    <button
                      onClick={() => handleDelete(item.edgeId)}
                      className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer opacity-0 group/result:opacity-100 transition-opacity"
                      title="Remove output"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Content based on type */}
                  <div className="text-xs text-zinc-700">
                    {type === "image" && item.value ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-zinc-100 bg-zinc-50 flex items-center justify-center">
                          <img
                            src={item.value}
                            alt={item.label}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <button
                          onClick={() => handleDownload(item.value || "", `download-${item.label}.png`)}
                          className="self-end px-2 py-1 bg-zinc-50 border border-zinc-250 rounded text-[10px] font-semibold text-zinc-600 hover:bg-zinc-100 flex items-center gap-1 cursor-pointer shadow-3xs"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    ) : type === "video" && item.value ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <VideoIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <span className="font-medium text-[11px] text-zinc-600 truncate">{item.value.split('/').pop() || "Video output"}</span>
                          </div>
                          <button
                            onClick={() => handleDownload(item.value || "", `download-${item.label}.mp4`)}
                            className="px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-3xs"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ) : type === "audio" && item.value ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <MusicIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <span className="font-medium text-[11px] text-zinc-600 truncate">{item.value.split('/').pop() || "Audio output"}</span>
                          </div>
                          <button
                            onClick={() => handleDownload(item.value || "", `download-${item.label}.mp3`)}
                            className="px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-3xs"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ) : item.value ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="line-clamp-4 leading-relaxed whitespace-pre-wrap">
                          <ReactMarkdown>{item.value}</ReactMarkdown>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.value || "");
                            alert("Copied to clipboard!");
                          }}
                          className="self-end px-2 py-1 bg-zinc-50 border border-zinc-250 rounded text-[10px] font-semibold text-zinc-600 hover:bg-zinc-100 flex items-center gap-1 cursor-pointer shadow-3xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic">No output yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}
