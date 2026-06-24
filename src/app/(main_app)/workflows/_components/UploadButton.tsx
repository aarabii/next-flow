"use client";

import * as React from "react";
import { Image as ImageIcon, Video as VideoIcon, Music as MusicIcon, File as FileIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadButtonProps {
  variant: "image" | "video" | "audio" | "file";
  onChange?: (url: string, fileName: string) => void;
  className?: string;
  disabled?: boolean;
}

export function UploadButton({ variant, onChange, className, disabled }: UploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const getLabel = () => {
    if (isUploading) return "Uploading...";
    switch (variant) {
      case "image":
        return "Upload Image";
      case "video":
        return "Upload Video";
      case "audio":
        return "Upload Audio";
      case "file":
      default:
        return "Upload File";
    }
  };

  const getIcon = () => {
    if (isUploading) {
      return <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />;
    }
    switch (variant) {
      case "image":
        return <ImageIcon className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 transition-colors" />;
      case "video":
        return <VideoIcon className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 transition-colors" />;
      case "audio":
        return <MusicIcon className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 transition-colors" />;
      case "file":
      default:
        return <FileIcon className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 transition-colors" />;
    }
  };

  const getAccept = () => {
    switch (variant) {
      case "image":
        return "image/*";
      case "video":
        return "video/*";
      case "audio":
        return "audio/*";
      default:
        return "*";
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const data = await response.json();
      onChange?.(data.url, file.name);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={getAccept()}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={cn(
          "group w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-zinc-200 rounded-lg hover:border-purple-400 hover:bg-purple-50/35 cursor-pointer transition-all duration-200 text-xs font-medium text-zinc-500 bg-zinc-50/50 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 disabled:pointer-events-none disabled:opacity-50",
          (disabled || isUploading) && "border-zinc-100 bg-zinc-100/50 text-zinc-300"
        )}
      >
        {getIcon()}
        <span>{getLabel()}</span>
      </button>
    </div>
  );
}
