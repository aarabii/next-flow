"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DetailsAccordionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  onCopy?: () => void;
}

export function DetailsAccordion({
  title,
  isOpen,
  onToggle,
  children,
  onCopy,
}: DetailsAccordionProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white text-left shadow-2xs">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="w-full flex items-center justify-between py-2 px-3 hover:bg-zinc-50/50 bg-zinc-50/30 transition-colors select-none cursor-pointer outline-none focus-visible:bg-zinc-100/50"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span>{title}</span>
        </div>
        {onCopy && (
          <Button
            variant="ghost"
            size="icon-xs"
            type="button"
            onClick={handleCopyClick}
            className="text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        )}
      </div>

      <div className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-in-out",
        isOpen ? "grid-rows-[1fr] border-t border-zinc-150" : "grid-rows-[0fr]"
      )}>
        <div className="overflow-hidden bg-white">
          <div className="p-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
