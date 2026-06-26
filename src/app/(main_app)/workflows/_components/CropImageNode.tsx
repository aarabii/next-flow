"use client";

import * as React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CropImageNodeData } from "@/types/node.type";
import { UploadButton } from "./UploadButton";
import { NodeWrapper } from "./NodeWrapper";

export function CropImageNode({
  id,
  data,
}: NodeProps<Node<CropImageNodeData>>) {
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

  const handleSliderChange = (
    field: "x" | "y" | "width" | "height",
    value: number,
  ) => {
    updateData({ [field]: value });
  };

  const isConnected = (handleId: string) => connectedInputs.includes(handleId);

  const onRunNode = data.onRunNode;
  const running = data.running ?? false;
  const onDeleteNode = data.onDeleteNode;

  const isValid = inputImage !== "" || isConnected("inputImage");

  const headerRight = !data.isSystem && (
    <button className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600">
      <RotateCcw className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <NodeWrapper
      id={id}
      title="Crop Image"
      running={running}
      isValid={isValid}
      validationError="Input Image is required."
      headerRightExtra={headerRight}
      onRunNode={onRunNode}
      onDeleteNode={onDeleteNode}
    >
      <div className="relative flex flex-col gap-1.5 group/field">
        <Handle
          type="target"
          position={Position.Left}
          id="inputImage"
          className="w-3! h-3! bg-blue-500! border-2! border-white! rounded-full! hover:!scale-125! transition-transform! -ml-1.5!"
        />

        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Input Image <span className="text-red-500">*</span>
        </span>

        <div
          className={cn(
            "w-full transition-opacity duration-200",
            isConnected("inputImage") && "opacity-60 pointer-events-none",
          )}
        >
          {isConnected("inputImage") ? (
            <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic">
              Linked to upstream node
            </div>
          ) : inputImage ? (
            <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded border border-zinc-100 bg-zinc-100 shrink-0 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inputImage}
                    alt="input preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-medium text-zinc-600 truncate max-w-37">
                  Attached Image
                </span>
              </div>
              {!data.isSystem && (
                <button
                  onClick={() => updateData({ inputImage: "" })}
                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          ) : data.isSystem ? (
            <div className="border border-dashed border-zinc-200 rounded-lg p-3 text-center bg-zinc-50/50 text-xs text-zinc-400">
              Image source locked for system flow
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

      <div className="flex flex-col gap-3">
        {(
          [
            { id: "x", label: "X Position (%)", val: x, defaultVal: 0 },
            { id: "y", label: "Y Position (%)", val: y, defaultVal: 0 },
            { id: "width", label: "Width (%)", val: width, defaultVal: 100 },
            { id: "height", label: "Height (%)", val: height, defaultVal: 100 },
          ] as const
        ).map((slider) => {
          const connected = isConnected(slider.id);
          return (
            <div
              key={slider.id}
              className="relative flex flex-col gap-1 group/field"
            >
              <Handle
                type="target"
                position={Position.Left}
                id={slider.id}
                className="w-3! h-3! bg-amber-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -ml-1.5"
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

              <div
                className={cn(
                  "w-full mt-1.5",
                  connected && "opacity-50 pointer-events-none",
                )}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slider.val}
                  onChange={(e) =>
                    handleSliderChange(slider.id, parseInt(e.target.value))
                  }
                  disabled={connected || !!data.isSystem}
                  className={cn(
                    "w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-purple-500 nodrag",
                    !!data.isSystem && "opacity-50 cursor-not-allowed",
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-zinc-100 my-1"></div>

      <div className="relative flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Output
        </span>

        <div className="border border-zinc-100 rounded-lg p-4 flex flex-col items-center justify-center bg-zinc-50/50 min-h-20">
          {outputImage ? (
            <div className="relative w-full h-20 rounded overflow-hidden border border-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={outputImage}
                alt="output preview"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <span className="text-xs text-zinc-400 italic">No output yet</span>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Right}
          id="outputImage"
          className="w-3! h-3! bg-blue-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -mr-1.5"
        />
      </div>
    </NodeWrapper>
  );
}
