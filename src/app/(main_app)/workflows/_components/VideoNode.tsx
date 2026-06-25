"use client";

import * as React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Video as VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import { VideoNodeData } from "@/types/node.type";
import { UploadButton } from "./UploadButton";
import { NodeWrapper } from "./NodeWrapper";
import { NodeSettings } from "./NodeSettings";

export function VideoNode({ id, data }: NodeProps<Node<VideoNodeData>>) {
  const prompt = data.prompt || "";
  const systemPrompt =
    data.systemPrompt ??
    "You are a video scene writer. Outline a continuous video description sequence based on the input.";
  const imageInput = data.imageInput || "";
  const imageInputFileName = data.imageInputFileName || "";
  const response = data.response || "";

  const temperature = data.temperature ?? 0.7;
  const topP = data.topP ?? 0.95;
  const maxTokens = data.maxTokens ?? 2048;

  const connectedInputs = data.connectedInputs || [];
  const isConnected = (handleId: string) => connectedInputs.includes(handleId);

  const updateData = (updates: Partial<VideoNodeData>) => {
    if (data.onChange) {
      data.onChange(id, updates);
    }
  };

  const onRunNode = data.onRunNode;
  const running = data.running;

  // Validation: at least one of prompt or imageInput must be present (or connected)
  const isValid =
    prompt.trim() !== "" ||
    imageInput !== "" ||
    isConnected("prompt") ||
    isConnected("image_input");

  return (
    <NodeWrapper
      id={id}
      title="Video Node"
      badge={GEMINI_MODEL_CONFIG.name}
      running={running}
      isValid={isValid}
      validationError="Either Text Prompt or Input Image is required."
      onRunNode={onRunNode}
      onDeleteNode={data.onDeleteNode}
    >
      {/* System Prompt (Required) */}
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

      {/* Text Prompt (Optional) */}
      <div className="relative flex flex-col gap-1.5 group/field">
        <Handle
          type="target"
          position={Position.Left}
          id="prompt"
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
        />
        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Text Prompt
        </span>
        <textarea
          value={prompt}
          onChange={(e) => updateData({ prompt: e.target.value })}
          disabled={isConnected("prompt")}
          placeholder={
            isConnected("prompt") ? "Linked to upstream source..." : "Enter text prompt..."
          }
          className={cn(
            "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-16 text-zinc-700 bg-zinc-50/20",
            isConnected("prompt") && "bg-zinc-50 text-zinc-400 italic"
          )}
        />
      </div>

      {/* Input Image (Optional) */}
      <div className="relative flex flex-col gap-1.5 group/field">
        <Handle
          type="target"
          position={Position.Left}
          id="image_input"
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
        />
        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Input Image
        </span>
        <div
          className={cn(
            "w-full",
            isConnected("image_input") && "opacity-60 pointer-events-none"
          )}
        >
          {isConnected("image_input") ? (
            <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic">
              Linked to upstream image
            </div>
          ) : imageInput ? (
            <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded border border-zinc-100 bg-zinc-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={imageInput}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-medium text-zinc-600 truncate max-w-[150px]">
                  {imageInputFileName || "Uploaded Image"}
                </span>
              </div>
              <button
                onClick={() => updateData({ imageInput: "", imageInputFileName: "" })}
                className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer"
              >
                Clear
              </button>
            </div>
          ) : (
            <UploadButton
              variant="image"
              onChange={(url, name) => {
                updateData({ imageInput: url, imageInputFileName: name });
              }}
            />
          )}
        </div>
      </div>

      {/* Collapsible Settings */}
      <NodeSettings
        temperature={temperature}
        topP={topP}
        maxTokens={maxTokens}
        onChange={(updates) => updateData(updates)}
      />

      {/* Output Video Section */}
      <div className="border-t border-zinc-100 pt-3 relative flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Output Video
        </span>

        <div className="border border-zinc-100 rounded-lg p-3 bg-zinc-50/50 min-h-[80px] flex items-center justify-center text-xs text-zinc-600">
          {response ? (
            <div className="border border-zinc-200 rounded-lg p-2.5 bg-white flex items-center gap-2 w-full">
              <VideoIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <span className="font-semibold text-[11px] text-zinc-700 truncate flex-1 font-mono">
                {response.split("/").pop() || "Video output"}
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
          className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-mr-1.5"
        />
      </div>
    </NodeWrapper>
  );
}
