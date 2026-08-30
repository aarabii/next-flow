"use client";

import * as React from "react";
import Image from "next/image";
import { Handle, Position } from "@xyflow/react";
import {
  Copy,
  Download,
  Maximize2,
  Trash2,
  Check,
  Type,
  Image as ImageIcon,
  Music as MusicIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RequestInputField } from "@/types/node.type";
import { AudioPlayer } from "./AudioPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";

interface DynamicFieldItemProps {
  field: RequestInputField;
  isLocked: boolean;
  isConnected: boolean;
  onValueChange: (
    fieldId: string,
    value: string,
    fileName?: string,
    fileSize?: string
  ) => void;
  onDelete?: (fieldId: string) => void;
  handleType?: "source" | "target";
  handlePosition?: Position;
}

export function DynamicFieldItem({
  field,
  isLocked,
  isConnected,
  onValueChange,
  onDelete,
  handleType,
  handlePosition,
}: DynamicFieldItemProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(field.value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleDownloadFile = async () => {
    try {
      const response = await fetch(field.value);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = field.fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
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
      onValueChange(field.id, uploadResult.url, file.name, sizeString);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearFile = () => {
    onValueChange(field.id, "", "", "");
  };

  // Determine handle color based on field type
  const handleColorClass =
    field.type === "image_field"
      ? "bg-blue-500!"
      : field.type === "audio_field"
        ? "bg-amber-500!"
        : "bg-purple-500!";

  return (
    <div className="relative flex flex-col gap-2 p-3 border border-zinc-200 rounded-xl bg-white shadow-xs group/field">
      {/* Target/Source Connection Handle */}
      {handleType && handlePosition && (
        <Handle
          type={handleType}
          position={handlePosition}
          id={field.id}
          className={cn(
            "w-3! h-3! border-2! border-white! rounded-full! hover:scale-125! transition-transform!",
            handlePosition === Position.Left ? "-ml-1.5!" : "-mr-1.5!",
            handleColorClass
          )}
        />
      )}

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
          <span className="text-xs font-semibold text-zinc-700">{field.label}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {field.type === "text_field" ? (
            <button
              type="button"
              onClick={handleCopyText}
              disabled={!field.value}
              className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer border-0 bg-transparent nodrag disabled:opacity-30 disabled:pointer-events-none"
            >
              {isCopied ? (
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
              onClick={handleDownloadFile}
              className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer border-0 bg-transparent nodrag disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          )}

          {!isLocked && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(field.id)}
              className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-red-650 transition-colors cursor-pointer border-0 bg-transparent nodrag"
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
            onChange={(e) => onValueChange(field.id, e.target.value)}
            disabled={isLocked || isConnected}
            placeholder={isConnected ? "Linked to upstream source..." : "Enter text..."}
            className={cn(
              "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 h-16 text-zinc-700 bg-zinc-50/20 resize-y nodrag pr-7 disabled:text-zinc-400",
              isConnected && "italic bg-zinc-50"
            )}
          />
          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            title="Open full editor"
            className="absolute right-2.5 bottom-2.5 p-1 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer bg-white/80 rounded border border-zinc-100 hover:border-purple-200 shadow-2xs nodrag"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="w-full relative">
          <div className={cn("w-full", isConnected && "opacity-65 pointer-events-none")}>
            {isConnected ? (
              <div className="border border-zinc-150 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic select-none">
                Linked to upstream source
              </div>
            ) : field.value ? (
              <div className="flex flex-col gap-2">
                <Attachment size="sm" state="done" className="w-full bg-zinc-50/70 dark:bg-zinc-800/60 border-zinc-200">
                  <AttachmentMedia variant={field.type === "image_field" ? "image" : "icon"}>
                    {field.type === "image_field" ? (
                      <img
                        src={field.value}
                        alt="Uploaded preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MusicIcon className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle className="text-zinc-700 dark:text-zinc-200">
                      {field.fileName || "Uploaded File"}
                    </AttachmentTitle>
                    <AttachmentDescription>
                      {field.fileSize || (field.type === "image_field" ? "Image file attached" : "Audio file attached")}
                    </AttachmentDescription>
                  </AttachmentContent>
                  {!isLocked && (
                    <AttachmentActions>
                      <AttachmentAction
                        onClick={handleClearFile}
                        title="Clear file"
                        className="hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </AttachmentAction>
                    </AttachmentActions>
                  )}
                </Attachment>

                {field.type === "audio_field" && <AudioPlayer url={field.value} />}
              </div>
            ) : (
              <div>
                <Attachment
                  size="sm"
                  state={isUploading ? "uploading" : "idle"}
                  onClick={() => !isLocked && !isUploading && document.getElementById(`file-input-${field.id}`)?.click()}
                  className={cn(
                    "w-full cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-colors",
                    isLocked && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <AttachmentMedia variant="icon">
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    ) : field.type === "image_field" ? (
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <MusicIcon className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle className="text-zinc-600">
                      {isUploading ? "Uploading file..." : `Upload ${field.type === "image_field" ? "Image" : "Audio"}`}
                    </AttachmentTitle>
                    <AttachmentDescription>
                      {isUploading ? "Please wait a moment" : "Click to browse"}
                    </AttachmentDescription>
                  </AttachmentContent>
                </Attachment>
                <input
                  type="file"
                  id={`file-input-${field.id}`}
                  accept={field.type === "image_field" ? "image/*" : "audio/*"}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLocked || isUploading}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog for larger Text Field editor */}
      {isEditorOpen && (
        <Dialog open={isEditorOpen} onOpenChange={(open) => !open && setIsEditorOpen(false)}>
          <DialogContent className="sm:max-w-xl bg-white border border-zinc-200 z-50">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-zinc-800">
                Edit {field.label}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <textarea
                value={field.value}
                disabled={isLocked || isConnected}
                onChange={(e) => onValueChange(field.id, e.target.value)}
                placeholder="Enter text..."
                className="w-full text-xs p-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 min-h-[300px] text-zinc-700 bg-zinc-50/20 resize-y"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-lg cursor-pointer border-0"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
