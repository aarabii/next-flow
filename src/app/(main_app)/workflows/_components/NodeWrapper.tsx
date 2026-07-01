import * as React from "react";
import { Play, MoreHorizontal, Trash2, AlertCircle, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { BaseWorkflowNodeData } from "@/types/node.type";

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
  menuItems?: React.ReactNode | ((closeMenu: () => void) => React.ReactNode);
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
  menuItems,
  children,
}: NodeWrapperProps) {
  const [showDeleteMenu, setShowDeleteMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const node = useWorkflowStore((state) => state.nodes.find((n) => n.id === id));
  const onNodeDataChange = useWorkflowStore((state) => state.onNodeDataChange);
  const nodeData = node?.data as BaseWorkflowNodeData | undefined;
  const isPositionLocked = nodeData?.isPositionLocked ?? false;
  const isLocked = nodeData?.isLocked ?? false;

  React.useEffect(() => {
    if (!showDeleteMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as globalThis.Node)
      ) {
        setShowDeleteMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDeleteMenu]);

  return (
    <div
      className={cn(
        "w-80 bg-white border rounded-xl shadow-md overflow-visible font-sans text-zinc-800 transition-all duration-300",
        running
          ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse"
          : (isLocked || isPositionLocked)
            ? "border-zinc-300 bg-zinc-50/10 shadow-xs"
            : !isValid
              ? "border-amber-300 shadow-sm"
              : "border-zinc-200",
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl">
        <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
          {headerLeftExtra || (
            <span className="font-bold text-xs text-zinc-700 tracking-wide uppercase truncate font-secondary flex items-center gap-1.5">
              {title}
              {isLocked && (
                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              {isPositionLocked && (
                <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              )}
            </span>
          )}
          {badge && (
            <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-medium truncate shrink-0">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {headerRightExtra}
          {onRunNode && (
            <button
              onClick={onRunNode}
              disabled={running || !isValid}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0",
                running
                  ? "bg-purple-50 text-purple-600 border border-purple-200"
                  : !isValid
                    ? "bg-zinc-50 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100/80",
              )}
              title={
                !isValid ? validationError || "Input is required" : "Run node"
              }
            >
              <Play
                className={cn(
                  "w-3 h-3 stroke-none",
                  running ? "fill-purple-600 animate-spin" : "fill-emerald-600",
                )}
              />
              <span>{running ? "Running..." : "Run"}</span>
            </button>
          )}

          {(onDeleteNode || id) && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 border-0 bg-transparent"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showDeleteMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 text-xs text-zinc-700 font-sans">
                  {/* Lock Node Item */}
                  <button
                    onClick={() => {
                      onNodeDataChange(id, { isLocked: !isLocked });
                      setShowDeleteMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 font-medium cursor-pointer border-0 bg-transparent text-zinc-700"
                  >
                    {isLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Unlock Node</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Lock Node</span>
                      </>
                    )}
                  </button>

                  {/* Position Lock Item */}
                  <button
                    onClick={() => {
                      onNodeDataChange(id, { isPositionLocked: !isPositionLocked });
                      setShowDeleteMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 font-medium cursor-pointer border-0 bg-transparent text-zinc-700"
                  >
                    {isPositionLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Unlock Position</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Lock Position</span>
                      </>
                    )}
                  </button>

                  {menuItems &&
                    (typeof menuItems === "function"
                      ? menuItems(() => setShowDeleteMenu(false))
                      : menuItems)}
                  {onRunNode && (
                    <button
                      onClick={() => {
                        onRunNode();
                        setShowDeleteMenu(false);
                      }}
                      disabled={running || !isValid}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 font-medium cursor-pointer disabled:opacity-50 disabled:pointer-events-none border-0 bg-transparent text-zinc-700"
                    >
                      <Play className="w-3.5 h-3.5 fill-zinc-500 stroke-none" />
                      <span>Run Node</span>
                    </button>
                  )}
                  {onDeleteNode && (
                    <button
                      onClick={() => {
                        onDeleteNode();
                        setShowDeleteMenu(false);
                      }}
                      disabled={isLocked}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 font-medium cursor-pointer border-0 bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Node</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isValid && (
        <div className="px-4 pt-3 flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50/30">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{validationError || "Inputs are required."}</span>
        </div>
      )}

      <div className="p-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}
