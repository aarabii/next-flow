"use client";

import * as React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import { TextNodeData, RequestInputField } from "@/types/node.type";
import { UploadButton } from "./UploadButton";
import { NodeWrapper } from "./NodeWrapper";
import { NodeSettings } from "./NodeSettings";
import { Trash2, Video as VideoIcon, Music as MusicIcon } from "lucide-react";

export function TextNode({ id, data }: NodeProps<Node<TextNodeData>>) {
  const prompt = data.prompt || "";
  const systemPrompt =
    data.systemPrompt ??
    "You are a helpful text generator assistant. Provide concise and accurate text responses.";
  const imageInput = data.imageInput || "";
  const imageInputFileName = data.imageInputFileName || "";
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

  const onRunNode = data.onRunNode;
  const running = data.running;

  // Backward-compatible fields setup
  const fields = React.useMemo<RequestInputField[]>(() => {
    if (data.fields) return data.fields;
    const initial: RequestInputField[] = [
      { id: "prompt", type: "text_field", label: "Prompt", value: prompt },
    ];
    if (imageInput) {
      initial.push({
        id: "image_input",
        type: "image_field",
        label: "Input Image",
        value: imageInput,
        fileName: imageInputFileName,
      });
    }
    return initial;
  }, [data.fields, prompt, imageInput, imageInputFileName]);

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
      title="Text Node"
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

      {/* Dynamic Fields */}
      {fields.map((field) => (
        <div key={field.id} className="relative flex flex-col gap-1.5 group/field">
          {/* Field Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
              {field.label}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity">
              <button
                onClick={() => handleDeleteField(field.id)}
                disabled={fields.length <= 1}
                className={cn(
                  "p-0.5 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 cursor-pointer",
                  fields.length <= 1 &&
                    "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-zinc-400"
                )}
                title="Delete field"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Field Input Area */}
          {field.type === "text_field" ? (
            <div className="relative">
              <Handle
                type="target"
                position={Position.Left}
                id={field.id}
                className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
              />
              <textarea
                value={field.value}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                disabled={isConnected(field.id)}
                placeholder={
                  isConnected(field.id) ? "Linked to upstream source..." : "Enter text..."
                }
                className={cn(
                  "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-20 text-zinc-700 bg-zinc-50/20",
                  isConnected(field.id) && "bg-zinc-50 text-zinc-400 italic"
                )}
              />
            </div>
          ) : (
            <div className="w-full font-sans text-zinc-700 relative">
              <Handle
                type="target"
                position={Position.Left}
                id={field.id}
                className={cn(
                  "!w-3 !h-3 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5",
                  field.type === "image_field" ? "!bg-blue-500" : "!bg-purple-500"
                )}
              />
              <div
                className={cn(
                  "w-full",
                  isConnected(field.id) && "opacity-60 pointer-events-none"
                )}
              >
                {isConnected(field.id) ? (
                  <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic">
                    Linked to upstream source
                  </div>
                ) : field.value ? (
                  <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded border border-zinc-100 bg-zinc-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {field.type === "image_field" ? (
                          <img
                            src={field.value}
                            alt="preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : field.type === "video_field" ? (
                          <VideoIcon className="w-4 h-4 text-blue-500" />
                        ) : (
                          <MusicIcon className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-600 truncate max-w-[150px]">
                        {field.fileName || (field.type === "image_field" ? "Uploaded Image" : field.type === "video_field" ? "Uploaded Video" : "Uploaded Audio")}
                      </span>
                    </div>
                    <button
                      onClick={() => handleValueChange(field.id, "", "")}
                      className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer transition-colors"
                      title="Clear file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <UploadButton
                    variant={field.type === "image_field" ? "image" : field.type === "video_field" ? "video" : "audio"}
                    onChange={(url, name) => {
                      handleValueChange(field.id, url, name);
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ))}

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
