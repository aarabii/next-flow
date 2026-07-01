"use client";

import * as React from "react";
import { Scissors, FileText } from "lucide-react";

export interface NodePickerProps {
  onSelect: (nodeType: "cropImage" | "textNode") => void;
  onClose: () => void;
}

export function NodePicker({ onSelect, onClose }: NodePickerProps) {
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

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 bg-white border border-zinc-200/80 rounded-xl shadow-2xl flex flex-col p-2.5 z-50 font-sans animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1 select-none">
        Add Component
      </div>
      <div className="flex flex-col gap-1 mt-1">
        <button
          type="button"
          onClick={() => onSelect("textNode")}
          className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50/20 hover:border-zinc-100 transition-colors cursor-pointer group border-0 bg-transparent"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-zinc-700 group-hover:text-purple-600 transition-colors">
              Text Node
            </span>
            <span className="text-[9px] text-zinc-400 leading-tight mt-0.5">
              Gemini model text outputs
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect("cropImage")}
          className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50/20 hover:border-zinc-100 transition-colors cursor-pointer group border-0 bg-transparent"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Scissors className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-zinc-700 group-hover:text-purple-600 transition-colors">
              Crop Node
            </span>
            <span className="text-[9px] text-zinc-400 leading-tight mt-0.5">
              Crop via FFmpeg parameters
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
