"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play, MoreHorizontal, ChevronDown, ChevronUp, Trash2, Plus, AlertCircle } from "lucide-react";
import { UploadButton } from "./UploadButton";
import { cn } from "@/lib/utils";

export interface GeminiImageField {
  id: string;
  value: string;
  fileName?: string;
}

export type GeminiNodeData = {
  model?: string;
  prompt?: string;
  systemPrompt?: string;
  systemPromptEnabled?: boolean;
  images?: GeminiImageField[];
  video?: string;
  videoFileName?: string;
  videoEnabled?: boolean;
  audio?: string;
  audioFileName?: string;
  audioEnabled?: boolean;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  connectedInputs?: string[];
  onChange?: (id: string, updatedData: Partial<GeminiNodeData>) => void;
};

export function GeminiNode({ id, data: rawData }: NodeProps) {
  const data = rawData as unknown as GeminiNodeData;
  // Node state initialization
  const model = data.model || "Gemini 3.1 Pro";
  const prompt = data.prompt || "";
  const systemPrompt = data.systemPrompt || "";
  const systemPromptEnabled = data.systemPromptEnabled ?? true;
  const images = data.images || [{ id: "image_0", value: "", fileName: "" }];
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
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const connectedInputs = data.connectedInputs || [];
  const isConnected = (handleId: string) => connectedInputs.includes(handleId);

  const updateData = (updates: Partial<GeminiNodeData>) => {
    if (data.onChange) {
      data.onChange(id, updates);
    }
  };

  const handleAddField = (type: "system" | "image" | "video" | "audio") => {
    if (type === "system") {
      updateData({ systemPromptEnabled: true });
    } else if (type === "video") {
      updateData({ videoEnabled: true });
    } else if (type === "audio") {
      updateData({ audioEnabled: true });
    } else if (type === "image") {
      const nextId = `image_${images.length}`;
      updateData({
        images: [...images, { id: nextId, value: "", fileName: "" }]
      });
    }
    setShowAddMenu(false);
  };

  const handleRemoveField = (type: "system" | "video" | "audio" | string) => {
    if (type === "system") {
      updateData({ systemPromptEnabled: false, systemPrompt: "" });
    } else if (type === "video") {
      updateData({ videoEnabled: false, video: "", videoFileName: "" });
    } else if (type === "audio") {
      updateData({ audioEnabled: false, audio: "", audioFileName: "" });
    } else {
      // It's a specific image field ID
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

  const canAddSystem = !systemPromptEnabled;
  const canAddVideo = !videoEnabled;
  const canAddAudio = !audioEnabled;
  const canAddAnything = canAddSystem || canAddVideo || canAddAudio || true; // Image can always be added

  return (
    <div className="w-80 bg-white border border-zinc-200 rounded-xl shadow-md overflow-visible font-sans text-zinc-800">
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {/* Custom Model Selector */}
          <select
            value={model}
            onChange={(e) => updateData({ model: e.target.value })}
            className="font-semibold text-xs text-zinc-700 tracking-wide bg-transparent border-none outline-none cursor-pointer uppercase py-0.5 pr-4 truncate max-w-[140px]"
          >
            <option value="Gemini 3.1 Pro">Gemini 3.1 Pro</option>
            <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
            <option value="Gemini 1.5 Flash">Gemini 1.5 Flash</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Add Option Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-500"
              title="Add inputs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {showAddMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                {canAddSystem && (
                  <button
                    onClick={() => handleAddField("system")}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  >
                    Add System Prompt
                  </button>
                )}
                <button
                  onClick={() => handleAddField("image")}
                  className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                >
                  Add Image field (Vision)
                </button>
                {canAddVideo && (
                  <button
                    onClick={() => handleAddField("video")}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  >
                    Add Video field
                  </button>
                )}
                {canAddAudio && (
                  <button
                    onClick={() => handleAddField("audio")}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  >
                    Add Audio field
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Run Button */}
          <button className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100/80 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer">
            <Play className="w-3 h-3 fill-emerald-600 stroke-none" />
            <span>Run</span>
          </button>

          <button className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inputs Section */}
      <div className="p-4 flex flex-col gap-4">
        
        {/* 1. Prompt (Required) */}
        <div className="relative flex flex-col gap-1.5">
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
            placeholder={isConnected("prompt") ? "Linked to upstream source..." : "Enter your prompt..."}
            className={cn(
              "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-16 text-zinc-700 bg-zinc-50/20",
              isConnected("prompt") && "bg-zinc-50 text-zinc-400 italic"
            )}
          />
        </div>

        {/* 2. System Prompt (Optional) */}
        {systemPromptEnabled && (
          <div className="relative flex flex-col gap-1.5 group/field">
            <Handle
              type="target"
              position={Position.Left}
              id="systemPrompt"
              className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                System Prompt
              </span>
              <button
                onClick={() => handleRemoveField("system")}
                className="p-0.5 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 cursor-pointer opacity-0 group-hover/field:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => updateData({ systemPrompt: e.target.value })}
              disabled={isConnected("systemPrompt")}
              placeholder={isConnected("systemPrompt") ? "Linked to upstream source..." : "System instructions..."}
              className={cn(
                "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-12 text-zinc-700 bg-zinc-50/20",
                isConnected("systemPrompt") && "bg-zinc-50 text-zinc-400 italic"
              )}
            />
          </div>
        )}

        {/* 3. Image Fields (Optional) */}
        {images.map((img, idx) => (
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
                Image {images.length > 1 ? `#${idx + 1}` : ""} (Vision)
              </span>
              {images.length > 0 && (
                <button
                  onClick={() => handleRemoveField(img.id)}
                  className="p-0.5 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 cursor-pointer opacity-0 group-hover/field:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className={cn("w-full", isConnected(img.id) && "opacity-60 pointer-events-none")}>
              {isConnected(img.id) ? (
                <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic">
                  Linked to upstream image
                </div>
              ) : img.value ? (
                <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded border border-zinc-100 bg-zinc-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <img src={img.value} alt="vision preview" className="w-full h-full object-cover" />
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
                  onChange={(file) => {
                    if (file) {
                      const url = URL.createObjectURL(file);
                      handleImageChange(img.id, url, file.name);
                    }
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
                  onChange={(file) => {
                    if (file) {
                      const url = URL.createObjectURL(file);
                      updateData({ video: url, videoFileName: file.name });
                    }
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
                  onChange={(file) => {
                    if (file) {
                      const url = URL.createObjectURL(file);
                      updateData({ audio: url, audioFileName: file.name });
                    }
                  }}
                />
              )}
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}
