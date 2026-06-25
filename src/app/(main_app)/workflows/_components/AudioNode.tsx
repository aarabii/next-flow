"use client";

import * as React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Music as MusicIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import { AudioNodeData } from "@/types/node.type";
import { NodeWrapper } from "./NodeWrapper";
import { NodeSettings } from "./NodeSettings";

export function AudioNode({ id, data }: NodeProps<Node<AudioNodeData>>) {
  const prompt = data.prompt || "";
  const systemPrompt =
    data.systemPrompt ??
    "You are a speech narrator. Write standard speech-to-text narrations.";
  const response = data.response || "";

  const temperature = data.temperature ?? 0.7;
  const topP = data.topP ?? 0.95;
  const maxTokens = data.maxTokens ?? 2048;

  const connectedInputs = data.connectedInputs || [];
  const isConnected = (handleId: string) => connectedInputs.includes(handleId);

  const updateData = (updates: Partial<AudioNodeData>) => {
    if (data.onChange) {
      data.onChange(id, updates);
    }
  };

  const onRunNode = data.onRunNode;
  const running = data.running;

  // Validation: prompt must be present (or connected)
  const isValid = prompt.trim() !== "" || isConnected("prompt");

  return (
    <NodeWrapper
      id={id}
      title="Audio Node"
      badge={GEMINI_MODEL_CONFIG.name}
      running={running}
      isValid={isValid}
      validationError="Prompt is required."
      onRunNode={onRunNode}
      onDeleteNode={data.onDeleteNode}
    >
      {/* System Prompt (Required) */}
      <div className="relative flex flex-col gap-1.5">
        <Handle
          type="target"
          position={Position.Left}
          id="systemPrompt"
          className="w-3! h-3! bg-amber-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -ml-1.5!"
        />
        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          System Prompt <span className="text-red-500">*</span>
        </span>
        <textarea
          value={systemPrompt}
          onChange={(e) => updateData({ systemPrompt: e.target.value })}
          disabled={isConnected("systemPrompt")}
          placeholder={
            isConnected("systemPrompt")
              ? "Linked to upstream source..."
              : "System instructions..."
          }
          className={cn(
            "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-16 text-zinc-700 bg-zinc-50/20",
            isConnected("systemPrompt") && "bg-zinc-50 text-zinc-400 italic",
          )}
        />
      </div>

      {/* Text Prompt */}
      <div className="relative flex flex-col gap-1.5 group/field">
        <Handle
          type="target"
          position={Position.Left}
          id="prompt"
          className="w-3! h-3! bg-amber-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -ml-1.5!"
        />
        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Text Prompt <span className="text-red-500">*</span>
        </span>
        <textarea
          value={prompt}
          onChange={(e) => updateData({ prompt: e.target.value })}
          disabled={isConnected("prompt")}
          placeholder={
            isConnected("prompt")
              ? "Linked to upstream source..."
              : "Enter text prompt..."
          }
          className={cn(
            "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-20 text-zinc-700 bg-zinc-50/20",
            isConnected("prompt") && "bg-zinc-50 text-zinc-400 italic",
          )}
        />
      </div>

      {/* Collapsible Settings */}
      <NodeSettings
        temperature={temperature}
        topP={topP}
        maxTokens={maxTokens}
        onChange={(updates) => updateData(updates)}
      />

      {/* Output Audio Section */}
      <div className="border-t border-zinc-100 pt-3 relative flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Output Audio
        </span>

        <div className="border border-zinc-100 rounded-lg p-3 bg-zinc-50/50 min-h-20 flex items-center justify-center text-xs text-zinc-600">
          {response ? (
            <div className="border border-zinc-200 rounded-lg p-2.5 bg-white flex items-center gap-2 w-full">
              <MusicIcon className="w-5 h-5 text-rose-500 shrink-0" />
              <span className="font-semibold text-[11px] text-zinc-700 truncate flex-1 font-mono">
                {response.split("/").pop() || "Audio output"}
              </span>
            </div>
          ) : (
            <span className="text-zinc-400 italic">No output yet</span>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Right}
          id="response"
          className="w-3! h-3! bg-rose-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -mr-1.5"
        />
      </div>
    </NodeWrapper>
  );
}
