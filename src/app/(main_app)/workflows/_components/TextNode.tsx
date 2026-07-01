"use client";

import * as React from "react";
import Image from "next/image";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { AudioPlayer } from "./AudioPlayer";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import { TextNodeData, RequestInputField } from "@/types/node.type";
import ReactMarkdown from "react-markdown";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  MoreVertical,
  Trash2,
  Copy,
  Download,
  Maximize2,
  Type,
  Image as ImageIcon,
  Music as MusicIcon,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Plus,
  AlertCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";



export function TextNode({ id, data }: NodeProps<Node<TextNodeData>>) {
  const prompt = data.prompt || "";
  const systemPrompt =
    data.systemPrompt ??
    "You are a helpful AI assistant. You accurate, safe, and helpful responses.";
  const imageInput = data.imageInput || "";
  const imageInputFileName = data.imageInputFileName || "";
  const response = data.response || "";

  const model = data.model || GEMINI_MODEL_CONFIG.textNode.defaultModelId;
  const temperature =
    data.temperature ?? GEMINI_MODEL_CONFIG.textNode.defaultTemperature;
  const topP = data.topP ?? GEMINI_MODEL_CONFIG.textNode.defaultTopP;
  const maxTokens =
    data.maxTokens ?? GEMINI_MODEL_CONFIG.textNode.defaultMaxTokens;
  const topK = data.topK ?? 40;
  const reasoning = data.reasoning ?? "Auto";
  const isLocked = data.isLocked ?? false;
  const expandResponse = data.expandResponse ?? false;
  const isPositionLocked = data.isPositionLocked ?? false;

  const connectedInputs = data.connectedInputs || [];
  const isConnected = (handleId: string) => connectedInputs.includes(handleId);

  const updateData = (updates: Partial<TextNodeData>) => {
    if (data.onChange) {
      data.onChange(id, updates);
    }
  };

  const onRunNode = data.onRunNode;
  const running = data.running ?? false;

  const nodes = useWorkflowStore((state) => state.nodes);
  const setNodes = useWorkflowStore((state) => state.setNodes);
  const takeSnapshot = useWorkflowStore((state) => state.takeSnapshot);

  const [copiedFieldId, setCopiedFieldId] = React.useState<string | null>(null);
  const [activeEditFieldId, setActiveEditFieldId] = React.useState<string | null>(null);
  const [uploadingFieldId, setUploadingFieldId] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

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

  const handleValueChange = (
    fieldId: string,
    value: string,
    fileName?: string,
    fileSize?: string,
  ) => {
    const updated = fields.map((f) =>
      f.id === fieldId ? { ...f, value, fileName, fileSize } : f,
    );
    updateData({ fields: updated });
  };

  const handleAddField = (
    type: "text_field" | "image_field" | "audio_field",
  ) => {
    if (isLocked || fields.length >= 8) return;

    const timestamp = Date.now();
    const newId = `${type}_${timestamp}`;

    let label = "Text Field";
    if (type === "image_field") label = "Image Field";
    if (type === "audio_field") label = "Audio Field";

    const typeCount = fields.filter((f) => f.type === type).length;
    const finalLabel = typeCount > 0 ? `${label} ${typeCount + 1}` : label;

    const newField: RequestInputField = {
      id: newId,
      type,
      label: finalLabel,
      value: "",
    };

    updateData({ fields: [...fields, newField] });
  };

  const handleDeleteField = (fieldId: string) => {
    if (isLocked) return;
    const updated = fields.filter((f) => f.id !== fieldId);
    updateData({ fields: updated });
  };

  const handleReset = () => {
    if (isLocked) return;
    updateData({
      systemPrompt: "You are a helpful AI assistant. You accurate, safe, and helpful responses.",
      temperature: GEMINI_MODEL_CONFIG.textNode.defaultTemperature,
      topP: GEMINI_MODEL_CONFIG.textNode.defaultTopP,
      maxTokens: GEMINI_MODEL_CONFIG.textNode.defaultMaxTokens,
      topK: 40,
      reasoning: "Auto",
      fields: [],
      expandResponse: false,
      response: "",
    });
  };

  const handleDuplicate = () => {
    takeSnapshot();
    const currentNode = nodes.find((n) => n.id === id);
    if (!currentNode) return;

    const newId = `${currentNode.type}_${Date.now()}`;
    const clonedFields = fields.map((f) => ({
      ...f,
      id: `${f.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    }));

    const clonedNode: Node = {
      ...currentNode,
      id: newId,
      position: {
        x: currentNode.position.x + 40,
        y: currentNode.position.y + 40,
      },
      data: {
        ...currentNode.data,
        fields: clonedFields,
        isLocked: false,
        response: "",
      },
    };

    setNodes((prevNodes) => [...prevNodes, clonedNode]);
  };

  const handleCopyFieldText = (fieldId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFieldId(fieldId);
    setTimeout(() => {
      setCopiedFieldId(null);
    }, 1500);
  };

  const handleDownloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldId: string,
    type: "image_field" | "audio_field"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFieldId(fieldId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const uploadResult = await res.json();
      const sizeString = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      handleValueChange(fieldId, uploadResult.url, file.name, sizeString);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Upload error: ${errorMessage}`);
    } finally {
      setUploadingFieldId(null);
    }
  };

  const isValid =
    systemPrompt.trim() !== "" ||
    fields.some((f) => f.value.trim() !== "" || isConnected(f.id));

  return (
    <TooltipProvider>
      <div
        className={cn(
          "w-[420px] bg-white border rounded-xl shadow-md overflow-visible font-sans text-zinc-800 transition-all duration-300",
          running
            ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            : (isLocked || isPositionLocked)
              ? "border-zinc-300 bg-zinc-50/10 shadow-xs"
              : !isValid
                ? "border-amber-300 shadow-sm"
                : "border-zinc-200",
        )}
      >
        {/* Node Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl select-none">
          <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
            <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-bold text-xs text-zinc-700 tracking-wide uppercase truncate">
              TextNode
            </span>
            {isLocked && (
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            {isPositionLocked && (
              <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-pointer text-zinc-400 hover:text-zinc-600 p-0.5 shrink-0">
                  <Info className="w-3.5 h-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px]">
                TextNode is used to send text, image, or audio inputs to the model and generate a text response.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={handleReset}
              disabled={isLocked}
              title="Reset all values"
              className="p-1.5 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 disabled:opacity-40 disabled:pointer-events-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onRunNode && (
              <button
                onClick={onRunNode}
                disabled={running || !isValid || isLocked}
                title={
                  !isValid
                    ? "At least one prompt or input source is required"
                    : isLocked
                      ? "Node is locked"
                      : "Run node"
                }
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none shrink-0 border-0"
              >
                <Play className={cn("w-3 h-3 fill-white text-white", running && "animate-spin")} />
                <span>{running ? "Running..." : "Run"}</span>
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 border-0">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-zinc-200">
                <DropdownMenuItem
                  onClick={() => updateData({ isLocked: !isLocked })}
                  className="cursor-pointer"
                >
                  {isLocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 mr-2" />
                      <span>Unlock node</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 mr-2" />
                      <span>Lock node</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateData({ isPositionLocked: !isPositionLocked })}
                  className="cursor-pointer"
                >
                  {isPositionLocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 mr-2" />
                      <span>Unlock Position</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 mr-2" />
                      <span>Lock Position</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDuplicate}
                  className="cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  <span>Duplicate this node</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => data.onDeleteNode?.()}
                  disabled={isLocked}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  <span>Delete node</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Validation Alert */}
        {!isValid && (
          <div className="px-4 py-2 flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50/30 border-b border-amber-100 select-none">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>At least one prompt or input source is required.</span>
          </div>
        )}

        {/* Node Body */}
        <div className="p-4 flex flex-col gap-4">
          {/* System Prompt (Default) */}
          <div className="relative flex flex-col gap-1.5 group/field">
            <Handle
              type="target"
              position={Position.Left}
              id="systemPrompt"
              className="w-3! h-3! bg-amber-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -ml-1.5!"
            />
            <span className="text-[11px] font-semibold text-blue-500 flex items-center gap-1 select-none">
              System prompt (Default)
            </span>
            <div className="relative flex items-center w-full border border-zinc-200 rounded-lg bg-zinc-50/20 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-shadow">
              <div className="pl-2 text-zinc-400 select-none">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => updateData({ systemPrompt: e.target.value })}
                disabled={isLocked || isConnected("systemPrompt")}
                placeholder={
                  isConnected("systemPrompt")
                    ? "Linked to upstream source..."
                    : "System instructions..."
                }
                className={cn(
                  "w-full text-xs p-2 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none h-16 text-zinc-700 nodrag disabled:text-zinc-400",
                  isConnected("systemPrompt") && "italic",
                )}
              />
            </div>
          </div>

          {/* Dynamic Fields List */}
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="relative flex flex-col gap-2 p-3 border border-zinc-200 rounded-xl bg-white shadow-xs group/field"
              >
                {/* Connection Handle */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={field.id}
                  className={cn(
                    "w-3! h-3! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -ml-1.5!",
                    field.type === "image_field"
                      ? "bg-blue-500!"
                      : field.type === "audio_field"
                        ? "bg-amber-500!"
                        : "bg-purple-500!"
                  )}
                />

                {/* Field Header */}
                <div className="flex items-center justify-between select-none">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded flex items-center justify-center shrink-0",
                        field.type === "image_field"
                          ? "bg-emerald-50 text-emerald-600"
                          : field.type === "audio_field"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-purple-50 text-purple-600"
                      )}
                    >
                      {field.type === "image_field" ? (
                        <ImageIcon className="w-3.5 h-3.5" />
                      ) : field.type === "audio_field" ? (
                        <MusicIcon className="w-3.5 h-3.5" />
                      ) : (
                        <Type className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-zinc-700">
                      {field.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {field.type === "text_field" ? (
                      <button
                        type="button"
                        onClick={() => handleCopyFieldText(field.id, field.value)}
                        className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer border-0 bg-transparent nodrag"
                      >
                        {copiedFieldId === field.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!field.value}
                        onClick={() => handleDownloadFile(field.value, field.fileName || "download")}
                        className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer border-0 bg-transparent nodrag disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    )}

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field.id)}
                        className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-red-600 transition-colors cursor-pointer border-0 bg-transparent nodrag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Field Body */}
                {field.type === "text_field" ? (
                  <div className="relative w-full">
                    <textarea
                      value={field.value}
                      onChange={(e) => handleValueChange(field.id, e.target.value)}
                      disabled={isLocked || isConnected(field.id)}
                      placeholder={
                        isConnected(field.id)
                          ? "Linked to upstream source..."
                          : "Enter text..."
                      }
                      className={cn(
                        "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 h-16 text-zinc-700 bg-zinc-50/20 resize-y nodrag pr-7 disabled:text-zinc-400",
                        isConnected(field.id) && "italic bg-zinc-50",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setActiveEditFieldId(field.id)}
                      title="Open full editor"
                      className="absolute right-2.5 bottom-2.5 p-1 text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer bg-white/80 rounded border border-zinc-100 hover:border-purple-200 shadow-2xs nodrag"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full relative">
                    <div className={cn("w-full", isConnected(field.id) && "opacity-60 pointer-events-none")}>
                      {isConnected(field.id) ? (
                        <div className="border border-zinc-150 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic">
                          Linked to upstream source
                        </div>
                      ) : field.value ? (
                        <div className="flex flex-col gap-2">
                          <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-10 h-10 rounded border border-zinc-155 bg-zinc-100 shrink-0 overflow-hidden flex items-center justify-center relative">
                                {field.type === "image_field" ? (
                                  <Image
                                    src={field.value}
                                    alt="Uploaded thumbnail"
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : (
                                  <MusicIcon className="w-4 h-4 text-amber-500 animate-pulse" />
                                )}
                              </div>
                              <div className="flex flex-col overflow-hidden text-left">
                                <span className="text-[11px] font-medium text-zinc-600 truncate max-w-44">
                                  {field.fileName || "Uploaded File"}
                                </span>
                                {field.fileSize && (
                                  <span className="text-[9px] text-zinc-400 select-none">
                                    {field.fileSize}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!isLocked && (
                              <button
                                type="button"
                                onClick={() => handleValueChange(field.id, "", "", "")}
                                className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer transition-colors border-0 bg-transparent nodrag"
                                title="Clear file"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {field.type === "audio_field" && (
                            <AudioPlayer url={field.value} />
                          )}
                        </div>
                      ) : (
                        <div>
                          <div
                            onClick={() => !isLocked && document.getElementById(`file-input-${field.id}`)?.click()}
                            className={cn(
                              "border border-dashed border-zinc-200 rounded-lg p-3.5 flex flex-col items-center justify-center gap-1.5 bg-zinc-50/30 hover:bg-zinc-50/70 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 nodrag",
                              isLocked && "opacity-50 cursor-not-allowed hover:bg-zinc-50/30"
                            )}
                          >
                            {uploadingFieldId === field.id ? (
                              <Loader2 className="w-4.5 h-4.5 animate-spin text-purple-600" />
                            ) : field.type === "image_field" ? (
                              <ImageIcon className="w-4.5 h-4.5 text-zinc-400" />
                            ) : (
                              <MusicIcon className="w-4.5 h-4.5 text-zinc-400" />
                            )}
                            <span className="text-[10px] font-medium">
                              {uploadingFieldId === field.id
                                ? "Uploading..."
                                : `Upload ${field.type === "image_field" ? "Image" : "Audio"}`}
                            </span>
                          </div>
                          <input
                            type="file"
                            id={`file-input-${field.id}`}
                            accept={field.type === "image_field" ? "image/*" : "audio/*"}
                            onChange={(e) => handleFileChange(e, field.id, field.type as "image_field" | "audio_field")}
                            className="hidden"
                            disabled={isLocked || uploadingFieldId !== null}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Field Button */}
          {fields.length < 8 && !isLocked && (
            <div className="flex flex-col gap-1.5 mt-1 select-none">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full border border-dashed border-zinc-300 hover:border-purple-500 rounded-lg py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-purple-600 transition-colors cursor-pointer bg-zinc-50/50 nodrag"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Field</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48 bg-white border border-zinc-200">
                  <DropdownMenuItem
                    onClick={() => handleAddField("text_field")}
                    className="cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5 mr-2 text-purple-600" />
                    <span>Add Text Field</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAddField("image_field")}
                    className="cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                    <span>Add Image Field</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAddField("audio_field")}
                    className="cursor-pointer"
                  >
                    <MusicIcon className="w-3.5 h-3.5 mr-2 text-amber-600" />
                    <span>Add Audio Field</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="text-center text-[10px] text-zinc-400 font-semibold">
                You can add up to 8 fields. ({fields.length}/8)
              </div>
            </div>
          )}

          {/* Settings Section */}
          <div className="border-t border-zinc-100 pt-2.5">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between text-xs font-semibold text-zinc-500 hover:text-zinc-700 cursor-pointer border-0 bg-transparent select-none"
            >
              <span>Settings</span>
              {settingsOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {settingsOpen && (
              <div className="grid grid-cols-2 gap-4 mt-3 text-[11px] text-zinc-600 bg-zinc-50/40 p-3 rounded-lg border border-zinc-150">
                {/* Temperature */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1 select-none">
                      Temperature
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer text-zinc-400 hover:text-zinc-600 p-0.5">
                            <Info className="w-3 h-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px]">
                          Controls the randomness of the output. Higher values make output more creative but less predictable.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      disabled={isLocked}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val)) val = 0;
                        updateData({ temperature: Math.max(0, Math.min(2, val)) });
                      }}
                      className="w-12 text-center text-[10px] px-1 py-0.5 border border-zinc-200 rounded-md text-zinc-700 bg-white font-mono nodrag disabled:bg-zinc-50"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    disabled={isLocked}
                    onChange={(e) => updateData({ temperature: parseFloat(e.target.value) })}
                    className="w-full accent-purple-600 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer nodrag disabled:opacity-50"
                  />
                </div>

                {/* Max Tokens */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1 select-none">
                      Max Tokens
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer text-zinc-400 hover:text-zinc-600 p-0.5">
                            <Info className="w-3 h-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px]">
                          The maximum number of tokens to generate in the response.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="8192"
                      value={maxTokens}
                      disabled={isLocked}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 1;
                        updateData({ maxTokens: Math.max(1, Math.min(8192, val)) });
                      }}
                      className="w-16 text-center text-[10px] px-1 py-0.5 border border-zinc-200 rounded-md text-zinc-700 bg-white font-mono nodrag disabled:bg-zinc-50"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8192"
                    value={maxTokens}
                    disabled={isLocked}
                    onChange={(e) => updateData({ maxTokens: parseInt(e.target.value) })}
                    className="w-full accent-purple-600 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer nodrag disabled:opacity-50"
                  />
                </div>

                {/* Reasoning */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1 select-none mb-0.5">
                    Reasoning
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer text-zinc-400 hover:text-zinc-600 p-0.5">
                          <Info className="w-3 h-3" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px]">
                        Configures the model's reasoning effort for complex problem solving.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <select
                    value={reasoning}
                    disabled={isLocked}
                    onChange={(e) => updateData({ reasoning: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-zinc-200 rounded-lg text-zinc-700 bg-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 nodrag disabled:bg-zinc-50 disabled:text-zinc-400"
                  >
                    <option value="Auto">Auto</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Top P */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1 select-none">
                      Top P
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer text-zinc-400 hover:text-zinc-600 p-0.5">
                            <Info className="w-3 h-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px]">
                          Nucleus sampling: controls the probability threshold for selecting tokens.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={topP}
                      disabled={isLocked}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val)) val = 0;
                        updateData({ topP: Math.max(0, Math.min(1, val)) });
                      }}
                      className="w-12 text-center text-[10px] px-1 py-0.5 border border-zinc-200 rounded-md text-zinc-700 bg-white font-mono nodrag disabled:bg-zinc-50"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={topP}
                    disabled={isLocked}
                    onChange={(e) => updateData({ topP: parseFloat(e.target.value) })}
                    className="w-full accent-purple-600 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer nodrag disabled:opacity-50"
                  />
                </div>

                {/* Top K */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1 select-none">
                      Top K
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer text-zinc-400 hover:text-zinc-600 p-0.5">
                            <Info className="w-3 h-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px]">
                          Limits generation to the top K most likely tokens at each step.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={topK}
                      disabled={isLocked}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 1;
                        updateData({ topK: Math.max(1, Math.min(100, val)) });
                      }}
                      className="w-12 text-center text-[10px] px-1 py-0.5 border border-zinc-200 rounded-md text-zinc-700 bg-white font-mono nodrag disabled:bg-zinc-50"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={topK}
                    disabled={isLocked}
                    onChange={(e) => updateData({ topK: parseInt(e.target.value) })}
                    className="w-full accent-purple-600 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer nodrag disabled:opacity-50"
                  />
                </div>

                {/* Model (Select Dropdown) */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1 select-none mb-0.5">
                    Model
                  </span>
                  <select
                    value={model}
                    disabled={isLocked}
                    onChange={(e) => updateData({ model: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-zinc-200 rounded-lg text-zinc-700 bg-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 nodrag disabled:bg-zinc-50 disabled:text-zinc-400"
                  >
                    {GEMINI_MODEL_CONFIG.textNode.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Response Output Section */}
          <div className="border-t border-zinc-100 pt-3.5 relative flex flex-col gap-2">
            <div className="flex items-center justify-between select-none">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                <span>Response</span>
              </span>

              {/* Custom Switch Component for Expand */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-zinc-500">Expand</span>
                <button
                  type="button"
                  onClick={() => updateData({ expandResponse: !expandResponse })}
                  className={cn(
                    "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    expandResponse ? "bg-purple-600" : "bg-zinc-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                      expandResponse ? "translate-x-3" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            <div
              className={cn(
                "border border-zinc-200 rounded-lg p-3 bg-zinc-50/50 text-xs text-zinc-700 relative transition-all duration-300",
                response ? "pr-2" : "",
                expandResponse ? "h-auto" : "max-h-36 overflow-y-auto"
              )}
            >
              {response ? (
                <div className="prose prose-sm max-w-none text-zinc-800 break-words text-left leading-relaxed">
                  <ReactMarkdown>{response}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-2 select-none">
                  <span className="text-zinc-400 italic">No Output Yet</span>
                </div>
              )}
            </div>

            {/* Response Output Connection Handle */}
            <Handle
              type="source"
              position={Position.Right}
              id="response"
              className="w-3! h-3! bg-amber-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -mr-1.5!"
            />
          </div>
        </div>

        {/* Dialog for larger Text Field view */}
        {activeEditFieldId !== null && (
          <Dialog open={activeEditFieldId !== null} onOpenChange={(open) => !open && setActiveEditFieldId(null)}>
            <DialogContent className="sm:max-w-xl bg-white border border-zinc-200">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-zinc-800">
                  Edit {fields.find((f) => f.id === activeEditFieldId)?.label || "Text Field"}
                </DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <textarea
                  value={fields.find((f) => f.id === activeEditFieldId)?.value || ""}
                  disabled={isLocked || isConnected(activeEditFieldId)}
                  onChange={(e) => handleValueChange(activeEditFieldId, e.target.value)}
                  placeholder="Enter text..."
                  className="w-full text-xs p-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 min-h-[300px] text-zinc-700 bg-zinc-50/20 resize-y"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setActiveEditFieldId(null)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-lg cursor-pointer border-0"
                >
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}
