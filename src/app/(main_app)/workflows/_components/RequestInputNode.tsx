"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Copy, Trash2, Plus, Check, MoreHorizontal } from "lucide-react";
import { UploadButton } from "./UploadButton";
import { cn } from "@/lib/utils";

export interface RequestInputField {
  id: string;
  type: "text_field" | "image_field";
  label: string;
  value: string;
  fileName?: string;
}

// React Flow custom node data type
export type RequestInputNodeData = {
  fields?: RequestInputField[];
  onChange?: (id: string, updatedData: Partial<RequestInputNodeData>) => void;
};

export function RequestInputNode({ id, data: rawData }: NodeProps) {
  const data = rawData as unknown as RequestInputNodeData;
  const fields = data.fields || [
    { id: "text_field", type: "text_field", label: "Text Field", value: "" },
    { id: "image_field", type: "image_field", label: "Image Field", value: "" }
  ];

  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const updateFields = (newFields: RequestInputField[]) => {
    if (data.onChange) {
      data.onChange(id, { fields: newFields });
    }
  };

  const handleValueChange = (fieldId: string, value: string, fileName?: string) => {
    const updated = fields.map((f) => 
      f.id === fieldId ? { ...f, value, fileName } : f
    );
    updateFields(updated);
  };

  const handleCopy = (field: RequestInputField) => {
    navigator.clipboard.writeText(field.value || field.label);
    setCopiedId(field.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (fieldId: string) => {
    if (fields.length <= 1) return; // Must keep at least one field
    const updated = fields.filter((f) => f.id !== fieldId);
    updateFields(updated);
  };

  const handleAddField = (type: "text_field" | "image_field") => {
    const exists = fields.some((f) => f.type === type);
    if (exists) return; // Prevent duplicate type fields for this trial

    const newField: RequestInputField = {
      id: type,
      type,
      label: type === "text_field" ? "Text Field" : "Image Field",
      value: "",
    };

    updateFields([...fields, newField]);
    setShowAddMenu(false);
  };

  const hasTextField = fields.some((f) => f.type === "text_field");
  const hasImageField = fields.some((f) => f.type === "image_field");
  const canAddField = !hasTextField || !hasImageField;

  return (
    <div className="w-80 bg-white border border-zinc-200 rounded-xl shadow-md overflow-visible font-sans text-zinc-800">
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl relative">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-xs text-zinc-700 tracking-wide uppercase">Request Inputs</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Add Field Button */}
          <div className="relative">
            <button
              onClick={() => canAddField && setShowAddMenu(!showAddMenu)}
              disabled={!canAddField}
              className={cn(
                "p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer",
                !canAddField && "opacity-40 cursor-not-allowed"
              )}
              title="Add field"
            >
              <Plus className="w-4 h-4 text-zinc-500" />
            </button>
            
            {showAddMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                {!hasTextField && (
                  <button
                    onClick={() => handleAddField("text_field")}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  >
                    Add Text Field
                  </button>
                )}
                {!hasImageField && (
                  <button
                    onClick={() => handleAddField("image_field")}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  >
                    Add Image Field
                  </button>
                )}
              </div>
            )}
          </div>
          <button className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer">
            <MoreHorizontal className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Fields List */}
      <div className="p-4 flex flex-col gap-4">
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
                  onClick={() => handleCopy(field)}
                  className="p-0.5 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  title="Copy value"
                >
                  {copiedId === field.id ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(field.id)}
                  disabled={fields.length <= 1}
                  className={cn(
                    "p-0.5 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 cursor-pointer",
                    fields.length <= 1 && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-zinc-400"
                  )}
                  title="Delete field"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Field Input Area */}
            {field.type === "text_field" ? (
              <textarea
                value={field.value}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                placeholder="Enter text..."
                className="w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-20 text-zinc-700 bg-zinc-50/20"
              />
            ) : (
              <div className="w-full">
                {field.value ? (
                  <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {/* Thumbnail preview */}
                      <div className="w-8 h-8 rounded border border-zinc-100 bg-zinc-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={field.value}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if not a real URL
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-600 truncate max-w-[150px]">
                        {field.fileName || "Uploaded Image"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleValueChange(field.id, "", "")}
                      className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer transition-colors"
                      title="Clear image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <UploadButton
                    variant="image"
                    onChange={(url, name) => {
                      handleValueChange(field.id, url, name);
                    }}
                  />
                )}
              </div>
            )}

            {/* Handle on the right for connecting downstream */}
            <Handle
              type="source"
              position={Position.Right}
              id={field.id}
              className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-mr-1.5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
