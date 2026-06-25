import * as React from "react";
import { Play, MoreHorizontal, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeWrapperProps {
  id: string;
  title: string;
  badge?: string;
  running?: boolean;
  isValid?: boolean;
  validationError?: string;
  onRunNode?: () => void;
  onDeleteNode?: () => void;
  headerLeftExtra?: React.ReactNode;
  headerRightExtra?: React.ReactNode;
  children: React.ReactNode;
}

export function NodeWrapper({
  id,
  title,
  badge,
  running = false,
  isValid = true,
  validationError,
  onRunNode,
  onDeleteNode,
  headerLeftExtra,
  headerRightExtra,
  children,
}: NodeWrapperProps) {
  const [showDeleteMenu, setShowDeleteMenu] = React.useState(false);

  return (
    <div
      className={cn(
        "w-80 bg-white border rounded-xl shadow-md overflow-visible font-sans text-zinc-800 transition-all duration-300",
        running
          ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse"
          : !isValid
          ? "border-amber-300 shadow-sm"
          : "border-zinc-200"
      )}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl">
        <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
          {headerLeftExtra || (
            <span className="font-bold text-xs text-zinc-700 tracking-wide uppercase truncate">
              {title}
            </span>
          )}
          {badge && (
            <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-medium truncate flex-shrink-0">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {headerRightExtra}
          {onRunNode && (
            <button
              onClick={onRunNode}
              disabled={running || !isValid}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex-shrink-0",
                running
                  ? "bg-purple-50 text-purple-600 border border-purple-200"
                  : !isValid
                  ? "bg-zinc-50 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100/80"
              )}
              title={!isValid ? validationError || "Input is required" : "Run node"}
            >
              <Play
                className={cn(
                  "w-3 h-3 stroke-none",
                  running ? "fill-purple-600 animate-spin" : "fill-emerald-600"
                )}
              />
              <span>{running ? "Running..." : "Run"}</span>
            </button>
          )}

          {onDeleteNode && (
            <div className="relative" onMouseLeave={() => setShowDeleteMenu(false)}>
              <button
                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showDeleteMenu && (
                <div className="absolute right-0 mt-1 w-28 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                  <button
                    onClick={() => {
                      onDeleteNode();
                      setShowDeleteMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Node</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Warning */}
      {!isValid && (
        <div className="px-4 pt-3 flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50/30">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{validationError || "Inputs are required."}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}
