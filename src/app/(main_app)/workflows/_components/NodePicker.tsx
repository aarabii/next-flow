"use client";

import * as React from "react";
import {
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Cpu,
  Clock,
  Layers,
  Scissors,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NodePickerProps {
  onSelect: (
    nodeType:
      | "cropImage"
      | "textNode",
  ) => void;
  onClose: () => void;
}

type CategoryId = "recent" | "image" | "video" | "audio" | "others";

interface PickerItem {
  id: "cropImage" | "textNode";
  title: string;
  description: string;
  category: CategoryId;
  icon: React.ReactNode;
}

export function NodePicker({ onSelect, onClose }: NodePickerProps) {
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] =
    React.useState<CategoryId>("recent");
  const pickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        !target.closest("#add-node-button")
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  const items: PickerItem[] = [
    {
      id: "cropImage",
      title: "Crop Image",
      description: "Crop and adjust image sizes via FFmpeg parameters",
      category: "image",
      icon: <Scissors className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: "textNode",
      title: "Text Node",
      description: "Generate high-quality text output using Gemini",
      category: "others",
      icon: <FileText className="w-4 h-4 text-amber-500" />,
    },
  ];

  const categories = [
    { id: "recent", label: "Recent", icon: <Clock className="w-3.5 h-3.5" /> },
    {
      id: "image",
      label: "Image",
      icon: <ImageIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "video",
      label: "Video",
      icon: <VideoIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "audio",
      label: "Audio",
      icon: <MusicIcon className="w-3.5 h-3.5" />,
    },
    { id: "others", label: "Others", icon: <Cpu className="w-3.5 h-3.5" /> },
  ] as const;

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === "recent") {
      return true;
    }

    return item.category === activeCategory;
  });

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-120 bg-white border border-zinc-200/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 font-sans animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 bg-zinc-50/20">
        <Search className="w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nodes..."
          className="flex-1 text-sm bg-transparent border-none outline-none text-zinc-800 placeholder-zinc-400"
          autoFocus
        />
      </div>

      <div className="flex h-64 overflow-hidden">
        <div className="w-36 border-r border-zinc-100 flex flex-col py-2 bg-zinc-50/50">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50 transition-colors cursor-pointer",
                activeCategory === cat.id &&
                  "bg-white text-purple-600 shadow-2xs border-l-2 border-purple-500",
              )}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-6">
              <Layers className="w-8 h-8 text-zinc-300 mb-1.5" />
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                No Nodes Found
              </span>
              <p className="text-xs text-zinc-400 max-w-50 mt-0.5">
                Try searching in other categories
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-zinc-100 hover:bg-purple-50/15 cursor-pointer hover:shadow-2xs transition-all group duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:scale-105 transition-all">
                  {item.icon}
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="text-xs font-bold text-zinc-700 group-hover:text-purple-600 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
