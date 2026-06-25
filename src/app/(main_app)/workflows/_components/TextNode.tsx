"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play, MoreHorizontal, ChevronDown, ChevronUp, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";

export type TextNodeData = {
  prompt?: string;
  systemPrompt?: string;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  connectedInputs?: string[];
  onChange?: (id: string, updatedData: Partial<TextNodeData>) => void;
};

export function TextNode({ id, data: rawData }: NodeProps) {
  const data = rawData as unknown as TextNodeData;
  const prompt = data.prompt || "";
  const systemPrompt = data.systemPrompt ?? "You are a helpful text generator assistant. Provide concise and accurate text responses.";
  const response = data.response || "";

  const temperature = data.temperature ?? 0.7;
  const topP = data.topP ?? 0.95;
  const maxTokens = data.maxTokens ?? 2048;

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = React.useState(false);

  const connectedInputs = data.connectedInputs || [];
  const isConnected = (handleId: string) => connectedInputs.includes(handleId);

  const updateData = (updates: Partial<TextNodeData>) => {
    if (data.onChange) {
      data.onChange(id, updates);
    }
  };

  const onRunNode = (data as any).onRunNode;
  const running = (data as any).running;

  // Since it's a TextNode, prompt is mandatory unless connected to an upstream source.
  const isValid = prompt.trim() !== "" || isConnected("prompt");

  return (
    <div className={cn(
      "w-80 bg-white border rounded-xl shadow-md overflow-visible font-sans text-zinc-800 transition-all duration-300",
      running 
        ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse" 
        : !isValid
        ? "border-amber-300 shadow-sm"
        : "border-zinc-200"
    )}>
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="font-bold text-xs text-zinc-700 tracking-wide uppercase truncate max-w-[140px]">
            Text Node
          </span>
          <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-medium">
            {GEMINI_MODEL_CONFIG.name}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Run Button */}
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
            title={!isValid ? "Provide a prompt to run this node" : "Run node"}
          >
            <Play className={cn("w-3 h-3 stroke-none", running ? "fill-purple-600 animate-spin" : "fill-emerald-600")} />
            <span>{running ? "Running..." : "Run"}</span>
          </button>

          {/* Delete Menu Trigger */}
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
                    if ((data as any).onDeleteNode) {
                      (data as any).onDeleteNode();
                    }
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
        </div>
      </div>

      {/* Validation warning if prompt is empty and not connected */}
      {!isValid && (
        <div className="px-4 pt-3 flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50/30">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Prompt is required.</span>
        </div>
      )}

      {/* Inputs Section */}
      <div className="p-4 flex flex-col gap-4">
        
        {/* System Prompt (Required, default provided) */}
        <div className="relative flex flex-col gap-1.5">
          <Handle
            type="target"
            position={Position.Left}
            id="systemPrompt"
            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
          />
          <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            System Prompt <span className="text-red-500">*</span>
          </span>
          <textarea
            value={systemPrompt}
            onChange={(e) => updateData({ systemPrompt: e.target.value })}
            disabled={isConnected("systemPrompt")}
            placeholder={isConnected("systemPrompt") ? "Linked to upstream source..." : "System instructions..."}
            className={cn(
              "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-16 text-zinc-700 bg-zinc-50/20",
              isConnected("systemPrompt") && "bg-zinc-50 text-zinc-400 italic"
            )}
          />
        </div>

        {/* Text Prompt */}
        <div className="relative flex flex-col gap-1.5 group/field">
          <Handle
            type="target"
            position={Position.Left}
            id="prompt"
            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
          />
          <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Prompt <span className="text-red-500">*</span>
          </span>
          <textarea
            value={prompt}
            onChange={(e) => updateData({ prompt: e.target.value })}
            disabled={isConnected("prompt")}
            placeholder={isConnected("prompt") ? "Linked to upstream source..." : "Enter prompt..."}
            className={cn(
              "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-20 text-zinc-700 bg-zinc-50/20",
              isConnected("prompt") && "bg-zinc-50 text-zinc-400 italic"
            )}
          />
        </div>

        {/* Collapsible Settings */}
        <div className="border-t border-zinc-100 pt-2.5">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-full flex items-center justify-between text-xs font-semibold text-zinc-500 hover:text-zinc-700 cursor-pointer"
          >
            <span>Settings</span>
            {settingsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          
          {settingsOpen && (
            <div className="flex flex-col gap-3 mt-3 text-xs text-zinc-600 bg-zinc-50/40 p-2 rounded-lg border border-zinc-100">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <span>Temperature</span>
                  <span>{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => updateData({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <span>Top P</span>
                  <span>{topP}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => updateData({ topP: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="flex justify-between items-center mt-1">
                <span>Max Tokens</span>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => updateData({ maxTokens: parseInt(e.target.value) || 1 })}
                  className="w-16 p-1 border border-zinc-200 rounded text-right font-mono text-[11px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Output Response Section */}
        <div className="border-t border-zinc-100 pt-3 relative flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Output Text
          </span>

          <div className="border border-zinc-100 rounded-lg p-3 bg-zinc-50/50 min-h-[60px] text-xs text-zinc-600">
            {response ? (
              <p className="whitespace-pre-wrap">{response}</p>
            ) : (
              <span className="text-zinc-400 italic">No output yet</span>
            )}
          </div>

          <Handle
            type="source"
            position={Position.Right}
            id="response"
            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-mr-1.5"
          />
        </div>
      </div>
    </div>
  );
}
