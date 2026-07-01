"use client";

import * as React from "react";
import Image from "next/image";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  Trash2,
  Download,
  HelpCircle,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Copy,
  Check,
  Maximize2,
  Play,
  Pause,
} from "lucide-react";
import { ResponseNodeData, ResponseResultItem } from "@/types/node.type";
import { AudioPlayer } from "./AudioPlayer";
import { NodeWrapper } from "./NodeWrapper";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";



export function ResponseNode({ id, data }: NodeProps<Node<ResponseNodeData>>) {
  const results = data.results || [];
  const [copiedEdgeId, setCopiedEdgeId] = React.useState<string | null>(null);
  const [activeViewEdgeId, setActiveViewEdgeId] = React.useState<string | null>(null);

  const handleDelete = (edgeId: string) => {
    if (data.onDeleteConnection) {
      data.onDeleteConnection(edgeId);
    }
  };

  const detectType = (
    item: ResponseResultItem,
  ): "image" | "video" | "audio" | "text" => {
    if (item.type) return item.type;
    const val = item.value || "";
    if (
      val.startsWith("data:image/") ||
      val.startsWith("blob:") ||
      /\.(jpg|jpeg|png|webp|gif)$/i.test(val)
    ) {
      return "image";
    }
    if (val.startsWith("data:video/") || /\.(mp4|webm|mov)$/i.test(val)) {
      return "video";
    }
    if (val.startsWith("data:audio/") || /\.(mp3|wav|ogg)$/i.test(val)) {
      return "audio";
    }
    if (
      item.sourceHandleId === "outputImage" ||
      item.sourceHandleId?.startsWith("image_field") ||
      item.sourceHandleId === "image_input"
    ) {
      return "image";
    }
    if (item.sourceHandleId?.startsWith("audio_field")) {
      return "audio";
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

  const handleCopyText = (edgeId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEdgeId(edgeId);
    setTimeout(() => {
      setCopiedEdgeId(null);
    }, 1500);
  };

  const headerRight = (
    <button className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400 border-0 bg-transparent">
      <HelpCircle className="w-4 h-4" />
    </button>
  );

  return (
    <NodeWrapper id={id} title="Response" headerRightExtra={headerRight}>
      <Handle
        type="target"
        position={Position.Left}
        id="result"
        className="w-3! h-3! bg-purple-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -ml-1.5"
      />

      <div className="flex flex-col gap-3 min-h-25">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-xl py-8 px-4 text-center bg-zinc-50/20 h-full select-none">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Result Area
            </span>
            <p className="text-xs text-zinc-400">
              Connect output nodes to collect results here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-90 overflow-y-auto pr-1">
            {results.map((item) => {
              const type = detectType(item);
              return (
                <div
                  key={item.edgeId}
                  className="border border-zinc-200 rounded-xl p-3 bg-white hover:border-zinc-300 transition-all shadow-xs flex flex-col gap-2.5 group/result"
                >
                  <div className="flex items-center justify-between border-b border-zinc-50 pb-1.5 select-none">
                    <span className="text-xs font-semibold text-zinc-650 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      {type === "image" && (
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      {type === "video" && (
                        <VideoIcon className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      {type === "audio" && (
                        <MusicIcon className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      {type === "text" && (
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                      )}
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {type === "text" ? (
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.edgeId, item.value || "")}
                          className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer border-0 bg-transparent nodrag"
                        >
                          {copiedEdgeId === item.edgeId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!item.value}
                          onClick={() => handleDownload(item.value || "", item.fileName || `download-${item.label}.${type === "image" ? "png" : type === "video" ? "mp4" : "mp3"}`)}
                          className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer border-0 bg-transparent nodrag disabled:opacity-40"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(item.edgeId)}
                        className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer opacity-0 group-hover/result:opacity-100 transition-opacity border-0 bg-transparent"
                        title="Remove output"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-700">
                    {type === "image" && item.value ? (
                      <div className="flex flex-col gap-2">
                        <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-10 h-10 rounded border border-zinc-150 bg-zinc-100 shrink-0 overflow-hidden flex items-center justify-center relative">
                              <Image
                                src={item.value}
                                alt={item.label}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <div className="flex flex-col overflow-hidden text-left">
                              <span className="text-[11px] font-medium text-zinc-650 truncate max-w-44">
                                {item.fileName || item.value.split("/").pop() || "Output Image"}
                              </span>
                              {item.fileSize && (
                                <span className="text-[9px] text-zinc-400 select-none">
                                  {item.fileSize}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : type === "video" && item.value ? (
                      <div className="flex flex-col gap-2">
                        <div className="border border-zinc-200 rounded-lg p-2.5 bg-zinc-50/50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-10 h-10 rounded border border-zinc-150 bg-zinc-100 shrink-0 flex items-center justify-center">
                              <VideoIcon className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="font-medium text-[11px] text-zinc-650 truncate max-w-44">
                              {item.value.split("/").pop() || "Video output"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : type === "audio" && item.value ? (
                      <div className="flex flex-col gap-2">
                        <div className="border border-zinc-200 rounded-lg p-2.5 bg-zinc-50/50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-10 h-10 rounded border border-zinc-150 bg-zinc-100 shrink-0 flex items-center justify-center">
                              <MusicIcon className="w-4 h-4 text-amber-500 animate-pulse" />
                            </div>
                            <div className="flex flex-col text-left overflow-hidden">
                              <span className="font-medium text-[11px] text-zinc-650 truncate max-w-44">
                                {item.fileName || item.value.split("/").pop() || "Audio output"}
                              </span>
                              {item.fileSize && (
                                <span className="text-[9px] text-zinc-400 select-none">
                                  {item.fileSize}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <AudioPlayer url={item.value} />
                      </div>
                    ) : item.value ? (
                      <div className="flex flex-col gap-1.5 relative">
                        <div className="line-clamp-4 leading-relaxed whitespace-pre-wrap text-zinc-700 bg-zinc-50/20 p-2.5 rounded-lg border border-zinc-150">
                          <ReactMarkdown>{item.value}</ReactMarkdown>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveViewEdgeId(item.edgeId)}
                          title="Open fullscreen preview"
                          className="absolute right-2 bottom-2 p-1 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer bg-white/80 rounded border border-zinc-100 hover:border-purple-200 shadow-2xs nodrag"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic">
                        No output yet
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog for larger Markdown Response view */}
      {activeViewEdgeId !== null && (
        <Dialog open={activeViewEdgeId !== null} onOpenChange={(open) => !open && setActiveViewEdgeId(null)}>
          <DialogContent className="sm:max-w-xl bg-white border border-zinc-200 flex flex-col max-h-[85vh]">
            <DialogHeader className="shrink-0 select-none">
              <DialogTitle className="text-sm font-bold text-zinc-800">
                View {results.find((r) => r.edgeId === activeViewEdgeId)?.label || "Text Response"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-2 pr-1 min-h-[300px]">
              <div className="text-xs leading-relaxed whitespace-pre-wrap text-zinc-700 bg-zinc-50/20 p-4 rounded-lg border border-zinc-150 prose prose-zinc prose-xs">
                <ReactMarkdown>{results.find((r) => r.edgeId === activeViewEdgeId)?.value || ""}</ReactMarkdown>
              </div>
            </div>
            <div className="flex justify-end gap-2 shrink-0 select-none mt-2">
              <Button
                type="button"
                onClick={() => setActiveViewEdgeId(null)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-lg cursor-pointer border-0"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </NodeWrapper>
  );
}
