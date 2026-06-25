"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Plus, Trash2 } from "lucide-react";
import { UploadButton } from "./UploadButton";
import { cn } from "@/lib/utils";
import { GeminiNodeData, GeminiImageField } from "@/types/node.type";
import { NodeWrapper } from "./NodeWrapper";
import { NodeSettings } from "./NodeSettings";

export function GeminiNode({ id, data: rawData }: NodeProps) {
  const data = rawData as unknown as GeminiNodeData;
  const model = data.model || "Gemini 3 Flash Preview";
  const prompt = data.prompt || "";
  const promptEnabled = data.promptEnabled ?? true;
  const systemPrompt = data.systemPrompt || "";
  const images = data.images || [];
  const video = data.video || "";
  const videoFileName = data.videoFileName || "";
  const videoEnabled = data.videoEnabled ?? false;
  const audio = data.audio || "";
  const audioFileName = data.audioFileName || "";
  const audioEnabled = data.audioEnabled ?? false;
  const response = data.response || "";

  // Settings
  const temperature = data.temperature ?? 1.0;
  const topP = data.topP ?? 0.95;
  const maxTokens = data.maxTokens ?? 2048;
  
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const connectedInputs = data.connectedInputs || [];
  const isConnected = (handleId: string) => connectedInputs.includes(handleId);

  const updateData = (updates: Partial<GeminiNodeData>) => {
    if (data.onChange) {
      data.onChange(id, updates);
    }
  };

  const handleAddField = (type: "prompt" | "image" | "video" | "audio") => {
    if (type === "prompt") {
      updateData({ promptEnabled: true });
    } else if (type === "video") {
      updateData({ videoEnabled: true });
    } else if (type === "audio") {
      updateData({ audioEnabled: true });
    } else if (type === "image") {
      const nextId = `image_${images.length}`;
      updateData({
        images: [...images, { id: nextId, value: "", fileName: "" }],
      });
    }
    setShowAddMenu(false);
  };

  const handleRemoveField = (type: "prompt" | "video" | "audio" | string) => {
    if (type === "prompt") {
      updateData({ promptEnabled: false, prompt: "" });
    } else if (type === "video") {
      updateData({ videoEnabled: false, video: "", videoFileName: "" });
    } else if (type === "audio") {
      updateData({ audioEnabled: false, audio: "", audioFileName: "" });
    } else {
      const updatedImages = images.filter((img) => img.id !== type);
      updateData({ images: updatedImages });
    }
  };

  const handleImageChange = (imgId: string, value: string, fileName?: string) => {
    const updatedImages = images.map((img) =>
      img.id === imgId ? { ...img, value, fileName } : img
    );
    updateData({ images: updatedImages });
  };

  const canAddPrompt = !promptEnabled;
  const canAddVideo = !videoEnabled;
  const canAddAudio = !audioEnabled;

  const onRunNode = (data as any).onRunNode;
  const running = (data as any).running;

  // Validation: prompt is required if enabled
  const isValid = !promptEnabled || prompt.trim() !== "" || isConnected("prompt");

  // Custom Model Dropdown for the Left side of header
  const headerLeftExtra = (
    <select
      value={model}
      onChange={(e) => updateData({ model: e.target.value })}
      className="font-semibold text-xs text-zinc-700 tracking-wide bg-transparent border-none outline-none cursor-pointer uppercase py-0.5 pr-4 truncate max-w-[170px]"
    >
      <option value="Gemini 3 Flash Preview">Gemini 3 Flash Preview</option>
      <option value="Gemini 3 Pro Preview">Gemini 3 Pro Preview</option>
      <option value="Gemini 3 Pro Image Preview">Gemini 3 Pro Image Preview</option>
    </select>
  );

  // Add inputs dropdown for the right side of header
  const headerRightExtra = (
    <div className="relative" onMouseLeave={() => setShowAddMenu(false)}>
      <button
        onClick={() => setShowAddMenu(!showAddMenu)}
        className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-500 flex items-center justify-center"
        title="Add inputs"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      {showAddMenu && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 text-xs">
          {canAddPrompt && (
            <button
              onClick={() => handleAddField("prompt")}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
            >
              Add Text Prompt
            </button>
          )}
          <button
            onClick={() => handleAddField("image")}
            className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
          >
            Add Image field (Vision)
          </button>
          {canAddVideo && (
            <button
              onClick={() => handleAddField("video")}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
            >
              Add Video field
            </button>
          )}
          {canAddAudio && (
            <button
              onClick={() => handleAddField("audio")}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
            >
              Add Audio field
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <NodeWrapper
      id={id}
      title="Gemini Node"
      headerLeftExtra={headerLeftExtra}
      headerRightExtra={headerRightExtra}
      running={running}
      isValid={isValid}
      validationError="Prompt is enabled but empty."
      onRunNode={onRunNode}
      onDeleteNode={(data as any).onDeleteNode}
    >
      {/* 1. System Prompt (Required) */}
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

      {/* 2. Text Prompt (Optional) */}
      {promptEnabled && (
        <div className="relative flex flex-col gap-1.5 group/field">
          <Handle
            type="target"
            position={Position.Left}
            id="prompt"
            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Prompt <span className="text-red-500">*</span>
            </span>
            <button
              onClick={() => handleRemoveField("prompt")}
              className="p-0.5 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 cursor-pointer opacity-0 group-hover/field:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
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
              isConnected("prompt") && "bg-zinc-50 text-zinc-400 italic"
            )}
          />
        </div>
      )}

      {/* 3. Images List (Vision) */}
      {images.map((img) => (
        <div key={img.id} className="relative flex flex-col gap-1.5 group/field">
          <Handle
            type="target"
            position={Position.Left}
            id={img.id}
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Image (Vision)
            </span>
            <button
              onClick={() => handleRemoveField(img.id)}
              className="p-0.5 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 cursor-pointer opacity-0 group-hover/field:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div
            className={cn(
              "w-full",
              isConnected(img.id) && "opacity-60 pointer-events-none"
            )}
          >
            {isConnected(img.id) ? (
              <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic">
                Linked to upstream image
              </div>
            ) : img.value ? (
              <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded border border-zinc-100 bg-zinc-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src={img.value}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-600 truncate max-w-[150px]">
                    {img.fileName || "Vision Image"}
                  </span>
                </div>
                <button
                  onClick={() => handleImageChange(img.id, "", "")}
                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ) : (
              <UploadButton
                variant="image"
                onChange={(url, name) => {
                  handleImageChange(img.id, url, name);
                }}
              />
            )}
          </div>
        </div>
      ))}

      {/* 4. Video (Optional) */}
      {videoEnabled && (
        <div className="relative flex flex-col gap-1.5 group/field">
          <Handle
            type="target"
            position={Position.Left}
            id="video"
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Video
            </span>
            <button
              onClick={() => handleRemoveField("video")}
              className="p-0.5 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 cursor-pointer opacity-0 group-hover/field:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className={cn("w-full", isConnected("video") && "opacity-60 pointer-events-none")}>
            {isConnected("video") ? (
              <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic">
                Linked to upstream video
              </div>
            ) : video ? (
              <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                <span className="text-[11px] font-medium text-zinc-600 truncate max-w-[200px]">
                  {videoFileName || "Video File"}
                </span>
                <button
                  onClick={() => updateData({ video: "", videoFileName: "" })}
                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ) : (
              <UploadButton
                variant="video"
                onChange={(url, name) => {
                  updateData({ video: url, videoFileName: name });
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* 5. Audio (Optional) */}
      {audioEnabled && (
        <div className="relative flex flex-col gap-1.5 group/field">
          <Handle
            type="target"
            position={Position.Left}
            id="audio"
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Audio
            </span>
            <button
              onClick={() => handleRemoveField("audio")}
              className="p-0.5 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 cursor-pointer opacity-0 group-hover/field:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className={cn("w-full", isConnected("audio") && "opacity-60 pointer-events-none")}>
            {isConnected("audio") ? (
              <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic">
                Linked to upstream audio
              </div>
            ) : audio ? (
              <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                <span className="text-[11px] font-medium text-zinc-600 truncate max-w-[200px]">
                  {audioFileName || "Audio File"}
                </span>
                <button
                  onClick={() => updateData({ audio: "", audioFileName: "" })}
                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ) : (
              <UploadButton
                variant="audio"
                onChange={(url, name) => {
                  updateData({ audio: url, audioFileName: name });
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Collapsible Settings */}
      <NodeSettings
        temperature={temperature}
        topP={topP}
        maxTokens={maxTokens}
        onChange={(updates) => updateData(updates)}
      />

      {/* Output Section */}
      <div className="border-t border-zinc-100 pt-3 relative flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Response
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
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-mr-1.5"
        />
      </div>
    </NodeWrapper>
  );
}
