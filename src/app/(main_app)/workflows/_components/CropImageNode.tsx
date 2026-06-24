"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { RotateCcw, Play, MoreHorizontal, Image as ImageIcon } from "lucide-react";
import { UploadButton } from "./UploadButton";
import { cn } from "@/lib/utils";

export type CropImageNodeData = {
  inputImage?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  outputImage?: string;
  connectedInputs?: string[]; // passed from canvas to know which handles are connected
  onChange?: (id: string, updatedData: Partial<CropImageNodeData>) => void;
};

export function CropImageNode({ id, data: rawData }: NodeProps) {
  const data = rawData as unknown as CropImageNodeData;
  const x = data.x ?? 0;
  const y = data.y ?? 0;
  const width = data.width ?? 100;
  const height = data.height ?? 100;
  const inputImage = data.inputImage || "";
  const outputImage = data.outputImage || "";
  const connectedInputs = data.connectedInputs || [];

  const updateData = (updates: Partial<CropImageNodeData>) => {
    if (data.onChange) {
      data.onChange(id, updates);
    }
  };

  const handleSliderChange = (field: "x" | "y" | "width" | "height", value: number) => {
    updateData({ [field]: value });
  };

  // Helper to check if a specific input handle is connected
  const isConnected = (handleId: string) => connectedInputs.includes(handleId);

  const onRunNode = (data as any).onRunNode;
  const running = (data as any).running;

  return (
    <div className={cn(
      "w-80 bg-white border rounded-xl shadow-md overflow-visible font-sans text-zinc-800 transition-all duration-300",
      running 
        ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse" 
        : "border-zinc-200"
    )}>
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-xs text-zinc-700 tracking-wide uppercase">Crop Image</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Retry Icon */}
          <button className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          
          {/* Run Button */}
          <button 
            onClick={onRunNode}
            disabled={running}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50",
              running 
                ? "bg-purple-50 text-purple-600 border border-purple-200"
                : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100/80"
            )}
          >
            <Play className={cn("w-3 h-3 stroke-none", running ? "fill-purple-600 animate-spin" : "fill-emerald-600")} />
            <span>{running ? "Running..." : "Run"}</span>
          </button>

          <button className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-4 flex flex-col gap-4">
        {/* Input Image */}
        <div className="relative flex flex-col gap-1.5 group/field">
          {/* Input Handle */}
          <Handle
            type="target"
            position={Position.Left}
            id="inputImage"
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
          />

          <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Input Image <span className="text-red-500">*</span>
          </span>

          <div className={cn("w-full transition-opacity duration-200", isConnected("inputImage") && "opacity-60 pointer-events-none")}>
            {isConnected("inputImage") ? (
              <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic">
                Linked to upstream node
              </div>
            ) : inputImage ? (
              <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded border border-zinc-100 bg-zinc-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={inputImage} alt="input preview" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-600 truncate max-w-[150px]">
                    Attached Image
                  </span>
                </div>
                <button
                  onClick={() => updateData({ inputImage: "" })}
                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <UploadButton
                variant="image"
                onChange={(url) => {
                  updateData({ inputImage: url });
                }}
              />
            )}
          </div>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-3">
          {([
            { id: "x", label: "X Position (%)", val: x, defaultVal: 0 },
            { id: "y", label: "Y Position (%)", val: y, defaultVal: 0 },
            { id: "width", label: "Width (%)", val: width, defaultVal: 100 },
            { id: "height", label: "Height (%)", val: height, defaultVal: 100 },
          ] as const).map((slider) => {
            const connected = isConnected(slider.id);
            return (
              <div key={slider.id} className="relative flex flex-col gap-1 group/field">
                {/* Parameter Handle */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={slider.id}
                  className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
                />

                <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {slider.label}
                  </span>
                  <span className="text-zinc-600 font-mono text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded">
                    {connected ? "Linked" : `${slider.val}%`}
                  </span>
                </div>

                <div className={cn("w-full mt-1.5", connected && "opacity-50 pointer-events-none")}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={slider.val}
                    onChange={(e) => handleSliderChange(slider.id, parseInt(e.target.value))}
                    disabled={connected}
                    className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Horizontal Separator */}
        <div className="border-t border-zinc-100 my-1"></div>

        {/* Output Section */}
        <div className="relative flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Output
          </span>

          <div className="border border-zinc-100 rounded-lg p-4 flex flex-col items-center justify-center bg-zinc-50/50 min-h-[80px]">
            {outputImage ? (
              <div className="relative w-full h-20 rounded overflow-hidden border border-zinc-200">
                <img src={outputImage} alt="output preview" className="w-full h-full object-contain" />
              </div>
            ) : (
              <span className="text-xs text-zinc-400 italic">No output yet</span>
            )}
          </div>

          {/* Output Handle */}
          <Handle
            type="source"
            position={Position.Right}
            id="outputImage"
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-mr-1.5"
          />
        </div>
      </div>
    </div>
  );
}
