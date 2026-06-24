import * as React from "react";
import { Image as ImageIcon, Video as VideoIcon, Music as MusicIcon, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadButtonProps {
  variant: "image" | "video" | "audio" | "file";
  onChange?: (file: File | null) => void;
  className?: string;
  disabled?: boolean;
}

export function UploadButton({ variant, onChange, className, disabled }: UploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getLabel = () => {
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
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onChange?.(e.target.files[0]);
    } else {
      onChange?.(null);
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
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "group w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-zinc-200 rounded-lg hover:border-purple-400 hover:bg-purple-50/35 cursor-pointer transition-all duration-200 text-xs font-medium text-zinc-500 bg-zinc-50/50 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 disabled:pointer-events-none disabled:opacity-50",
          disabled && "border-zinc-100 bg-zinc-100/50 text-zinc-300"
        )}
      >
        {getIcon()}
        <span>{getLabel()}</span>
      </button>
    </div>
  );
}
