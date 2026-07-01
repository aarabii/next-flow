"use client";

import * as React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import { TextNodeData, RequestInputField } from "@/types/node.type";
import ReactMarkdown from "react-markdown";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { NodeWrapper } from "./NodeWrapper";
import { DynamicFieldsList } from "./DynamicFieldsList";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RotateCcw,
  Copy,
  Lock,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  MessageSquare,
  Type,
  Image as ImageIcon,
  Music as MusicIcon,
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

  const description = data.description ?? "TextNode is used to send text, image, or audio inputs to the model and generate a text response.";
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

  const isValid =
    systemPrompt.trim() !== "" ||
    fields.some((f) => f.value.trim() !== "" || isConnected(f.id));

  return (
    <TooltipProvider>
      <NodeWrapper
        id={id}
        title="TextNode"
        className="w-[420px]"
        running={running}
        isValid={isValid}
        validationError="At least one prompt or input source is required."
        onRunNode={onRunNode}
        onDeleteNode={data.onDeleteNode}
        description={description}
        headerRightExtra={
          <button
            onClick={handleReset}
            disabled={isLocked}
            title="Reset all values"
            className="p-1.5 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400 hover:text-zinc-650 disabled:opacity-40 disabled:pointer-events-none border-0 bg-transparent nodrag shrink-0 flex items-center justify-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        }
        menuItems={
          <DropdownMenuItem
            onClick={handleDuplicate}
            className="cursor-pointer text-zinc-700"
          >
            <Copy className="w-3.5 h-3.5 mr-2 text-zinc-500" />
            <span>Duplicate this node</span>
          </DropdownMenuItem>
        }
      >
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
        <DynamicFieldsList
          fields={fields}
          isLocked={isLocked}
          isConnected={isConnected}
          onValueChange={handleValueChange}
          onDeleteField={handleDeleteField}
          handleType="target"
          handlePosition={Position.Left}
        />

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
            <div className="grid grid-cols-2 gap-4 mt-3 text-[11px] text-zinc-650 bg-zinc-50/40 p-3 rounded-lg border border-zinc-150">
              {/* Left Side: Parameters (Sliders) */}
              <div className="flex flex-col gap-3.5">
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
                      className="w-12 text-center text-[10px] px-1 py-0.5 border border-zinc-200 rounded-md text-zinc-750 bg-white font-mono nodrag disabled:bg-zinc-50"
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
                          <div className="cursor-pointer text-zinc-400 hover:text-zinc-650 p-0.5">
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
                      className="w-16 text-center text-[10px] px-1 py-0.5 border border-zinc-200 rounded-md text-zinc-750 bg-white font-mono nodrag disabled:bg-zinc-50"
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
                      className="w-12 text-center text-[10px] px-1 py-0.5 border border-zinc-200 rounded-md text-zinc-750 bg-white font-mono nodrag disabled:bg-zinc-50"
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
                          <div className="cursor-pointer text-zinc-400 hover:text-zinc-650 p-0.5">
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
                      className="w-12 text-center text-[10px] px-1 py-0.5 border border-zinc-200 rounded-md text-zinc-750 bg-white font-mono nodrag disabled:bg-zinc-50"
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
              </div>

              {/* Right Side: Configurations (Dropdowns) */}
              <div className="flex flex-col gap-3.5">
                {/* Model */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1 select-none mb-0.5">
                    Model
                  </span>
                  <select
                    value={model}
                    disabled={isLocked}
                    onChange={(e) => updateData({ model: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-zinc-200 rounded-lg text-zinc-750 bg-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 nodrag disabled:bg-zinc-50 disabled:text-zinc-405 cursor-pointer"
                  >
                    {GEMINI_MODEL_CONFIG.textNode.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
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
                        Configures the model&apos;s reasoning effort for complex problem solving.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <select
                    value={reasoning}
                    disabled={isLocked}
                    onChange={(e) => updateData({ reasoning: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-zinc-200 rounded-lg text-zinc-750 bg-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 nodrag disabled:bg-zinc-50 disabled:text-zinc-405 cursor-pointer"
                  >
                    <option value="Auto">Auto</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
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
              "border border-zinc-200 rounded-lg p-3 bg-zinc-50/50 text-xs text-zinc-700 relative transition-all duration-350",
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
      </NodeWrapper>
    </TooltipProvider>
  );
}
