"use client";

import * as React from "react";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  File as FileIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
} from "@/components/ui/attachment";

export interface UploadButtonProps {
  variant: "image" | "video" | "audio" | "file";
  onChange?: (url: string, fileName: string) => void;
  className?: string;
  disabled?: boolean;
}

export function UploadButton({
  variant,
  onChange,
  className,
  disabled,
}: UploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const getLabel = () => {
    if (isUploading) return "Uploading file...";
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
      return <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />;
    }
    switch (variant) {
      case "image":
        return <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />;
      case "video":
        return <VideoIcon className="w-3.5 h-3.5 text-zinc-400" />;
      case "audio":
        return <MusicIcon className="w-3.5 h-3.5 text-zinc-400" />;
      case "file":
      default:
        return <FileIcon className="w-3.5 h-3.5 text-zinc-400" />;
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${errorMessage}`);
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
      <Attachment
        size="sm"
        state={isUploading ? "uploading" : "idle"}
        onClick={handleClick}
        className={cn(
          "w-full cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-colors",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        <AttachmentMedia variant="icon">{getIcon()}</AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle className="text-zinc-600 dark:text-zinc-300">
            {getLabel()}
          </AttachmentTitle>
          <AttachmentDescription>
            {isUploading ? "Processing upload..." : "Click to select file"}
          </AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </div>
  );
}
