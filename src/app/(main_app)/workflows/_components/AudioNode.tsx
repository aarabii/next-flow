"use client";

import * as React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Music as MusicIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import { AudioNodeData, RequestInputField } from "@/types/node.type";
import { DynamicFieldsList } from "./DynamicFieldsList";
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

  // Backward-compatible fields setup
  const fields = React.useMemo<RequestInputField[]>(() => {
    if (data.fields) return data.fields;
    return [
      { id: "prompt", type: "text_field", label: "Prompt", value: prompt },
    ];
  }, [data.fields, prompt]);

  const handleValueChange = (fieldId: string, value: string, fileName?: string) => {
    const updated = fields.map((f) =>
      f.id === fieldId ? { ...f, value, fileName } : f
    );
    updateData({ fields: updated });
  };

  const handleAddField = (type: "text_field" | "image_field" | "video_field" | "audio_field") => {
    const timestamp = Date.now();
    const newId = `${type}_${timestamp}`;
    
    let label = "Text Field";
    if (type === "image_field") label = "Image Field";
    if (type === "video_field") label = "Video Field";
    if (type === "audio_field") label = "Audio Field";

    const typeCount = fields.filter((f) => f.type === type).length;
    const finalLabel = typeCount > 0 ? `${label} ${typeCount + 1}` : label;

    const newField = {
      id: newId,
      type,
      label: finalLabel,
      value: "",
    };

    updateData({ fields: [...fields, newField] });
  };

  const handleDeleteField = (fieldId: string) => {
    const updated = fields.filter((f) => f.id !== fieldId);
    updateData({ fields: updated });
  };

  // Validation: at least one field must have a value or be connected
  const isValid = fields.some((f) => f.value.trim() !== "" || isConnected(f.id));

  return (
    <NodeWrapper
      id={id}
      title="Audio Node"
      badge={GEMINI_MODEL_CONFIG.name}
      running={running}
      isValid={isValid}
      validationError="At least one prompt or input source is required."
      onRunNode={onRunNode}
      onDeleteNode={data.onDeleteNode}
      menuItems={(closeMenu) => (
        <>
          <button
            onClick={() => {
              handleAddField("text_field");
              closeMenu();
            }}
            className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
          >
            Add Text Field
          </button>
          <button
            onClick={() => {
              handleAddField("image_field");
              closeMenu();
            }}
            className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
          >
            Add Image Field
          </button>
          <button
            onClick={() => {
              handleAddField("video_field");
              closeMenu();
            }}
            className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
          >
            Add Video Field
          </button>
          <button
            onClick={() => {
              handleAddField("audio_field");
              closeMenu();
            }}
            className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
          >
            Add Audio Field
          </button>
          <div className="border-b border-zinc-100 my-1"></div>
        </>
      )}
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

      {/* Dynamic Fields */}
      <DynamicFieldsList
        fields={fields}
        isConnected={isConnected}
        onValueChange={handleValueChange}
        onDeleteField={handleDeleteField}
      />

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

        <div className="border border-zinc-100 rounded-lg p-3 bg-zinc-50/50 min-h-[80px] flex items-center justify-center text-xs text-zinc-600">
          {response ? (
            <div className="border border-zinc-200 rounded-lg p-2.5 bg-white flex items-center gap-2 w-full">
              <MusicIcon className="w-5 h-5 text-rose-500 flex-shrink-0" />
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
          className="!w-3 !h-3 !bg-rose-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-mr-1.5"
        />
      </div>
    </NodeWrapper>
  );
}
