"use client";

import * as React from "react";
import Image from "next/image";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { RequestInputNodeData, RequestInputField } from "@/types/node.type";
import { NodeWrapper } from "./NodeWrapper";
import { AudioPlayer } from "./AudioPlayer";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Copy,
  Download,
  Maximize2,
  Type,
  Image as ImageIcon,
  Music as MusicIcon,
  Lock,
  Unlock,
  Check,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";



export function RequestInputNode({
  id,
  data,
}: NodeProps<Node<RequestInputNodeData>>) {
  const fields = data.fields || [
    { id: "text_field", type: "text_field", label: "Text Field", value: "" },
    { id: "image_field", type: "image_field", label: "Image Field", value: "" },
  ];

  const isLocked = data.isLocked ?? false;

  const [copiedFieldId, setCopiedFieldId] = React.useState<string | null>(null);
  const [activeEditFieldId, setActiveEditFieldId] = React.useState<string | null>(null);
  const [uploadingFieldId, setUploadingFieldId] = React.useState<string | null>(null);

  const updateFields = (newFields: RequestInputField[]) => {
    if (data.onChange) {
      data.onChange(id, { fields: newFields });
    }
  };

  const handleValueChange = (
    fieldId: string,
    value: string,
    fileName?: string,
    fileSize?: string,
  ) => {
    const updated = fields.map((f) =>
      f.id === fieldId ? { ...f, value, fileName, fileSize } : f,
    );
    updateFields(updated);
  };

  const handleCopyFieldText = (fieldId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFieldId(fieldId);
    setTimeout(() => {
      setCopiedFieldId(null);
    }, 1500);
  };

  const handleDownloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldId: string,
    type: "image_field" | "audio_field"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFieldId(fieldId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const uploadResult = await res.json();
      const sizeString = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      handleValueChange(fieldId, uploadResult.url, file.name, sizeString);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${errorMessage}`);
    } finally {
      setUploadingFieldId(null);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    if (isLocked || fields.length <= 1) return;
    const updated = fields.filter((f) => f.id !== fieldId);
    updateFields(updated);
  };

  const handleAddField = (
    type: "text_field" | "image_field" | "audio_field",
  ) => {
    if (isLocked || fields.length >= 8) return;

    const timestamp = Date.now();
    const newId = `${type}_${timestamp}`;

    let label = "Text Field";
    if (type === "image_field") label = "Image Field";
    if (type === "audio_field") label = "Audio Field";

    const typeCount = fields.filter((f) => f.type === type).length;
    const finalLabel = typeCount > 0 ? `${label} ${typeCount + 1}` : label;

    const newField: RequestInputField = {
      id: newId,
      type,
      label: finalLabel,
      value: "",
    };

    updateFields([...fields, newField]);
  };

  return (
    <TooltipProvider>
      <NodeWrapper id={id} title="Request Inputs">
        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <div
              key={field.id}
              className="relative flex flex-col gap-2 p-3 border border-zinc-200 rounded-xl bg-white shadow-xs group/field"
            >
              {/* Field Header */}
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center shrink-0",
                      field.type === "image_field"
                        ? "bg-emerald-50 text-emerald-600"
                        : field.type === "audio_field"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-purple-50 text-purple-600"
                    )}
                  >
                    {field.type === "image_field" ? (
                      <ImageIcon className="w-3.5 h-3.5" />
                    ) : field.type === "audio_field" ? (
                      <MusicIcon className="w-3.5 h-3.5" />
                    ) : (
                      <Type className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-zinc-700">
                    {field.label}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {field.type === "text_field" ? (
                    <button
                      type="button"
                      onClick={() => handleCopyFieldText(field.id, field.value)}
                      className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer border-0 bg-transparent nodrag"
                    >
                      {copiedFieldId === field.id ? (
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
                      disabled={!field.value}
                      onClick={() => handleDownloadFile(field.value, field.fileName || "download")}
                      className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer border-0 bg-transparent nodrag disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  )}

                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id)}
                      disabled={fields.length <= 1}
                      className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-red-600 transition-colors cursor-pointer border-0 bg-transparent nodrag disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Field Body */}
              {field.type === "text_field" ? (
                <div className="relative w-full">
                  <textarea
                    value={field.value}
                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                    disabled={isLocked}
                    placeholder="Enter text..."
                    className={cn(
                      "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 h-16 text-zinc-700 bg-zinc-50/20 resize-y nodrag pr-7 disabled:text-zinc-400",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setActiveEditFieldId(field.id)}
                    title="Open full editor"
                    className="absolute right-2.5 bottom-2.5 p-1 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer bg-white/80 rounded border border-zinc-100 hover:border-purple-200 shadow-2xs nodrag"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-full relative">
                  <div className="w-full">
                    {field.value ? (
                      <div className="flex flex-col gap-2">
                        <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-10 h-10 rounded border border-zinc-155 bg-zinc-100 shrink-0 overflow-hidden flex items-center justify-center relative">
                              {field.type === "image_field" ? (
                                <Image
                                  src={field.value}
                                  alt="Uploaded thumbnail"
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <MusicIcon className="w-4 h-4 text-amber-500 animate-pulse" />
                              )}
                            </div>
                            <div className="flex flex-col overflow-hidden text-left">
                              <span className="text-[11px] font-medium text-zinc-600 truncate max-w-44">
                                {field.fileName || "Uploaded File"}
                              </span>
                              {field.fileSize && (
                                <span className="text-[9px] text-zinc-400 select-none">
                                  {field.fileSize}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => handleValueChange(field.id, "", "", "")}
                              className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer transition-colors border-0 bg-transparent nodrag"
                              title="Clear file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {field.type === "audio_field" && (
                          <AudioPlayer url={field.value} />
                        )}
                      </div>
                    ) : (
                      <div>
                        <div
                          onClick={() => !isLocked && document.getElementById(`file-input-${field.id}`)?.click()}
                          className={cn(
                            "border border-dashed border-zinc-200 rounded-lg p-3.5 flex flex-col items-center justify-center gap-1.5 bg-zinc-50/30 hover:bg-zinc-50/70 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 nodrag",
                            isLocked && "opacity-50 cursor-not-allowed hover:bg-zinc-50/30"
                          )}
                        >
                          {uploadingFieldId === field.id ? (
                            <Loader2 className="w-4.5 h-4.5 animate-spin text-purple-600" />
                          ) : field.type === "image_field" ? (
                            <ImageIcon className="w-4.5 h-4.5 text-zinc-400" />
                          ) : (
                            <MusicIcon className="w-4.5 h-4.5 text-zinc-400" />
                          )}
                          <span className="text-[10px] font-medium">
                            {uploadingFieldId === field.id
                              ? "Uploading..."
                              : `Upload ${field.type === "image_field" ? "Image" : "Audio"}`}
                          </span>
                        </div>
                        <input
                          type="file"
                          id={`file-input-${field.id}`}
                          accept={field.type === "image_field" ? "image/*" : "audio/*"}
                          onChange={(e) => handleFileChange(e, field.id, field.type as "image_field" | "audio_field")}
                          className="hidden"
                          disabled={isLocked || uploadingFieldId !== null}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Handle is positioned relative to this field's container */}
              <Handle
                type="source"
                position={Position.Right}
                id={field.id}
                className={cn(
                  "w-3! h-3! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -mr-1.5!",
                  field.type === "image_field"
                    ? "bg-blue-500!"
                    : field.type === "audio_field"
                      ? "bg-amber-500!"
                      : "bg-purple-500!"
                )}
              />
            </div>
          ))}
        </div>

        {/* Add Field Button */}
        {fields.length < 8 && !isLocked && (
          <div className="flex flex-col gap-1.5 mt-4 select-none">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-full border border-dashed border-zinc-300 hover:border-purple-500 rounded-lg py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-purple-600 transition-colors cursor-pointer bg-zinc-50/50 nodrag"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-white border border-zinc-200">
                <DropdownMenuItem
                  onClick={() => handleAddField("text_field")}
                  className="cursor-pointer"
                >
                  <Type className="w-3.5 h-3.5 mr-2 text-purple-600" />
                  <span>Add Text Field</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleAddField("image_field")}
                  className="cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                  <span>Add Image Field</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleAddField("audio_field")}
                  className="cursor-pointer"
                >
                  <MusicIcon className="w-3.5 h-3.5 mr-2 text-amber-600" />
                  <span>Add Audio Field</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="text-center text-[10px] text-zinc-400 font-semibold">
              You can add up to 8 fields. ({fields.length}/8)
            </div>
          </div>
        )}

        {/* Dialog for larger Text Field view */}
        {activeEditFieldId !== null && (
          <Dialog open={activeEditFieldId !== null} onOpenChange={(open) => !open && setActiveEditFieldId(null)}>
            <DialogContent className="sm:max-w-xl bg-white border border-zinc-200">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-zinc-800">
                  Edit {fields.find((f) => f.id === activeEditFieldId)?.label || "Text Field"}
                </DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <textarea
                  value={fields.find((f) => f.id === activeEditFieldId)?.value || ""}
                  disabled={isLocked}
                  onChange={(e) => handleValueChange(activeEditFieldId, e.target.value)}
                  placeholder="Enter text..."
                  className="w-full text-xs p-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 min-h-[300px] text-zinc-700 bg-zinc-50/20 resize-y"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setActiveEditFieldId(null)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-lg cursor-pointer border-0"
                >
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </NodeWrapper>
    </TooltipProvider>
  );
}
