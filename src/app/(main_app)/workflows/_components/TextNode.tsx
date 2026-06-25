"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import { TextNodeData } from "@/types/node.type";
import { NodeWrapper } from "./NodeWrapper";
import { NodeSettings } from "./NodeSettings";

export function TextNode({ id, data: rawData }: NodeProps) {
  const data = rawData as unknown as TextNodeData;
  const prompt = data.prompt || "";
  const systemPrompt =
    data.systemPrompt ??
    "You are a helpful text generator assistant. Provide concise and accurate text responses.";
  const response = data.response || "";

  const temperature = data.temperature ?? 0.7;
  const topP = data.topP ?? 0.95;
  const maxTokens = data.maxTokens ?? 2048;

  const connectedInputs = data.connectedInputs || [];
  const isConnected = (handleId: string) => connectedInputs.includes(handleId);

  const updateData = (updates: Partial<TextNodeData>) => {
    if (data.onChange) {
      data.onChange(id, updates);
    }
  };

  const onRunNode = (data as any).onRunNode;
  const running = (data as any).running;

  // Prompt is mandatory unless connected to an upstream source.
  const isValid = prompt.trim() !== "" || isConnected("prompt");

  return (
    <NodeWrapper
      id={id}
      title="Text Node"
      badge={GEMINI_MODEL_CONFIG.name}
      running={running}
      isValid={isValid}
      validationError="Prompt is required."
      onRunNode={onRunNode}
      onDeleteNode={(data as any).onDeleteNode}
    >
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
          placeholder={
            isConnected("systemPrompt")
              ? "Linked to upstream source..."
              : "System instructions..."
          }
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
          placeholder={
            isConnected("prompt") ? "Linked to upstream source..." : "Enter prompt..."
          }
          className={cn(
            "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-20 text-zinc-700 bg-zinc-50/20",
            isConnected("prompt") && "bg-zinc-50 text-zinc-400 italic"
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
    </NodeWrapper>
  );
}
