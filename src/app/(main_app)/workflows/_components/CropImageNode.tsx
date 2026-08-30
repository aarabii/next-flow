"use client";

import * as React from "react";
import Image from "next/image";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { CropImageNodeData } from "@/types/node.type";
import { UploadButton } from "./UploadButton";
import { NodeWrapper } from "./NodeWrapper";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RotateCcw,
  Copy,
  Download,
  Trash2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";

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
  const expandResponse = data.expandResponse ?? false;
  const isLocked = !!(data.isLocked || data.isSystem);

  const description =
    data.description ??
    "CropImageNode is used to crop an image to specified percentages from x, y, width, and height.";

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

  const nodes = useWorkflowStore((state) => state.nodes);
  const setNodes = useWorkflowStore((state) => state.setNodes);
  const takeSnapshot = useWorkflowStore((state) => state.takeSnapshot);

  const handleReset = () => {
    if (isLocked) return;
    updateData({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      inputImage: "",
      outputImage: "",
      expandResponse: false,
    });
  };

  const handleDuplicate = () => {
    takeSnapshot();
    const currentNode = nodes.find((n) => n.id === id);
    if (!currentNode) return;

    const newId = `${currentNode.type}_${Date.now()}`;

    const clonedNode: Node = {
      ...currentNode,
      id: newId,
      position: {
        x: currentNode.position.x + 40,
        y: currentNode.position.y + 40,
      },
      data: {
        ...currentNode.data,
        isLocked: false,
        outputImage: "",
      },
    };

    setNodes((prevNodes) => [...prevNodes, clonedNode]);
  };

  const handleDownloadFile = async () => {
    if (!outputImage) return;
    try {
      const response = await fetch(outputImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "cropped_image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const isValid = inputImage !== "" || isConnected("inputImage");

  return (
    <TooltipProvider>
      <NodeWrapper
        id={id}
        title="Crop Image"
        className="w-[420px]"
        running={running}
        isValid={isValid}
        validationError="Input Image is required."
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
          !data.isSystem ? (
            <DropdownMenuItem
              onClick={handleDuplicate}
              className="cursor-pointer text-zinc-700"
            >
              <Copy className="w-3.5 h-3.5 mr-2 text-zinc-500" />
              <span>Duplicate this node</span>
            </DropdownMenuItem>
          ) : undefined
        }
      >
        {/* Input Image Section */}
        <div className="relative flex flex-col gap-1.5 group/field">
          <Handle
            type="target"
            position={Position.Left}
            id="inputImage"
            className="w-3! h-3! bg-blue-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -ml-1.5!"
          />
          <span className="text-[11px] font-semibold text-blue-500 flex items-center gap-1 select-none">
            Input Image <span className="text-red-500">*</span>
          </span>

          <div
            className={cn(
              "w-full transition-opacity duration-200",
              isConnected("inputImage") && "opacity-60 pointer-events-none",
            )}
          >
            {isConnected("inputImage") ? (
              <div className="border border-zinc-200 rounded-lg p-2.5 bg-zinc-50/50 text-xs text-zinc-400 italic">
                Linked to upstream source...
              </div>
            ) : inputImage ? (
              <Attachment size="sm" state="done" className="w-full bg-zinc-50/70 dark:bg-zinc-800/60 border-zinc-200">
                <AttachmentMedia variant="image">
                  <img
                    src={inputImage}
                    alt="input preview"
                    className="w-full h-full object-cover"
                  />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle className="text-zinc-700 dark:text-zinc-200">
                    Attached Image
                  </AttachmentTitle>
                  <AttachmentDescription>
                    Ready for crop processing
                  </AttachmentDescription>
                </AttachmentContent>
                {!isLocked && !data.isSystem && (
                  <AttachmentActions>
                    <AttachmentAction
                      onClick={() => updateData({ inputImage: "" })}
                      title="Remove image"
                      className="hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </AttachmentAction>
                  </AttachmentActions>
                )}
              </Attachment>
            ) : data.isSystem ? (
              <div className="border border-dashed border-zinc-200 rounded-lg p-3 text-center bg-zinc-50/50 text-xs text-zinc-400">
                Image source locked for system flow
              </div>
            ) : (
              <UploadButton
                variant="image"
                disabled={isLocked}
                onChange={(url) => {
                  updateData({ inputImage: url });
                }}
              />
            )}
          </div>
        </div>

        {/* Sliders Section */}
        <div className="flex flex-col gap-3.5 bg-zinc-50/40 p-3 rounded-lg border border-zinc-150 relative">
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
                className="relative flex flex-col gap-1.5 group/field"
              >
                <Handle
                  type="target"
                  position={Position.Left}
                  id={slider.id}
                  className="w-3! h-3! bg-amber-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -ml-4.5!"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1 select-none">
                    {slider.label}
                  </span>
                  {connected ? (
                    <span className="text-zinc-500 font-mono text-[10px] bg-zinc-150/70 px-1.5 py-0.5 rounded select-none">
                      Linked
                    </span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={slider.val}
                      disabled={isLocked || connected || !!data.isSystem}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = slider.defaultVal;
                        handleSliderChange(slider.id, Math.max(0, Math.min(100, val)));
                      }}
                      className="w-12 text-center text-[10px] px-1 py-0.5 border border-zinc-200 rounded-md text-zinc-750 bg-white font-mono nodrag disabled:bg-zinc-50"
                    />
                  )}
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slider.val}
                  disabled={isLocked || connected || !!data.isSystem}
                  onChange={(e) => handleSliderChange(slider.id, parseInt(e.target.value))}
                  className="w-full accent-purple-600 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer nodrag disabled:opacity-50"
                />
              </div>
            );
          })}
        </div>

        {/* Response / Output Section */}
        <div className="border-t border-zinc-100 pt-3.5 relative flex flex-col gap-2">
          <div className="flex items-center justify-between select-none">
            <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>Response</span>
            </span>

            <div className="flex items-center gap-4">
              {outputImage && (
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-purple-655 transition-colors cursor-pointer border-0 bg-transparent nodrag"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              )}

              {/* Expand Switch */}
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
          </div>

          <div
            className={cn(
              "border border-zinc-200 rounded-lg p-3 bg-zinc-50/50 text-xs text-zinc-700 relative transition-all duration-350 flex items-center justify-center min-h-[80px]",
              expandResponse ? "h-64" : "h-28"
            )}
          >
            {outputImage ? (
              <div className="relative w-full h-full rounded overflow-hidden border border-zinc-150 bg-white">
                <Image
                  src={outputImage}
                  alt="output preview"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 380px"
                  loading="lazy"
                  className="object-contain"
                />
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
            id="outputImage"
            className="w-3! h-3! bg-blue-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -mr-1.5!"
          />
        </div>
      </NodeWrapper>
    </TooltipProvider>
  );
}
