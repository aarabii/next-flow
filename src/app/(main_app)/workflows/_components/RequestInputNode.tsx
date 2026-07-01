"use client";

import * as React from "react";
import { Position, type NodeProps, type Node } from "@xyflow/react";
import { RequestInputNodeData, RequestInputField } from "@/types/node.type";
import { NodeWrapper } from "./NodeWrapper";
import { DynamicFieldsList } from "./DynamicFieldsList";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Type,
  Image as ImageIcon,
  Music as MusicIcon,
  Plus,
  RotateCcw,
} from "lucide-react";

export function RequestInputNode({
  id,
  data,
}: NodeProps<Node<RequestInputNodeData>>) {
  const fields = data.fields || [
    { id: "text_field", type: "text_field", label: "Text Field", value: "" },
    { id: "image_field", type: "image_field", label: "Image Field", value: "" },
  ];

  const isLocked = data.isLocked ?? false;

  const updateFields = (newFields: RequestInputField[]) => {
    if (data.onChange) {
      data.onChange(id, { fields: newFields });
    }
  };

  const handleValueChange = (
    fieldId: string,
    value: string,
    fileName?: string,
    fileSize?: string,
  ) => {
    const updated = fields.map((f) =>
      f.id === fieldId ? { ...f, value, fileName, fileSize } : f,
    );
    updateFields(updated);
  };

  const handleDeleteField = (fieldId: string) => {
    if (isLocked || data.isSystem || fields.length <= 1) return;
    const updated = fields.filter((f) => f.id !== fieldId);
    updateFields(updated);
  };

  const handleAddField = (
    type: "text_field" | "image_field" | "audio_field",
  ) => {
    if (isLocked || data.isSystem || fields.length >= 8) return;

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

    updateFields([...fields, newField]);
  };

  const handleReset = () => {
    const resetFields = fields.map((f) => ({
      ...f,
      value: "",
      fileName: "",
      fileSize: "",
    }));
    updateFields(resetFields);
  };

  const headerRight = (
    <button
      type="button"
      onClick={handleReset}
      disabled={isLocked}
      title="Reset all values"
      className="p-1.5 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-400 hover:text-zinc-650 disabled:opacity-40 disabled:pointer-events-none border-0 bg-transparent nodrag shrink-0 flex items-center justify-center"
    >
      <RotateCcw className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <TooltipProvider>
      <NodeWrapper
        id={id}
        title="Request Inputs"
        description="Request Inputs node is used to define dynamic text, image, or audio input fields that feed into the workflow."
        headerRightExtra={headerRight}
      >
        <DynamicFieldsList
          fields={fields}
          isLocked={isLocked}
          isConnected={() => false}
          onValueChange={handleValueChange}
          onDeleteField={data.isSystem ? undefined : handleDeleteField}
          handleType="source"
          handlePosition={Position.Right}
        />

        {/* Add Field Button */}
        {fields.length < 8 && !isLocked && !data.isSystem && (
          <div className="flex flex-col gap-1.5 mt-4 select-none">
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
      </NodeWrapper>
    </TooltipProvider>
  );
}
