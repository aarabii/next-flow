"use client";

import * as React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  Copy,
  Trash2,
  Check,
  MoreHorizontal,
  Video as VideoIcon,
  Music as MusicIcon,
} from "lucide-react";
import { UploadButton } from "./UploadButton";
import { cn } from "@/lib/utils";
import { RequestInputNodeData, RequestInputField } from "@/types/node.type";
import { NodeWrapper } from "./NodeWrapper";

export function RequestInputNode({
  id,
  data,
}: NodeProps<Node<RequestInputNodeData>>) {
  const fields = data.fields || [
    { id: "text_field", type: "text_field", label: "Text Field", value: "" },
    { id: "image_field", type: "image_field", label: "Image Field", value: "" },
  ];

  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showAddMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as globalThis.Node)
      ) {
        setShowAddMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddMenu]);

  const updateFields = (newFields: RequestInputField[]) => {
    if (data.onChange) {
      data.onChange(id, { fields: newFields });
    }
  };

  const handleValueChange = (
    fieldId: string,
    value: string,
    fileName?: string,
  ) => {
    const updated = fields.map((f) =>
      f.id === fieldId ? { ...f, value, fileName } : f,
    );
    updateFields(updated);
  };

  const handleCopy = (field: RequestInputField) => {
    navigator.clipboard.writeText(field.value || field.label);
    setCopiedId(field.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (fieldId: string) => {
    if (fields.length <= 1) return;
    const updated = fields.filter((f) => f.id !== fieldId);
    updateFields(updated);
  };

  const handleAddField = (
    type: "text_field" | "image_field" | "video_field" | "audio_field",
  ) => {
    const timestamp = Date.now();
    const id = `${type}_${timestamp}`;

    let label = "Text Field";
    if (type === "image_field") label = "Image Field";
    if (type === "video_field") label = "Video Field";
    if (type === "audio_field") label = "Audio Field";

    const typeCount = fields.filter((f) => f.type === type).length;
    const finalLabel = typeCount > 0 ? `${label} ${typeCount + 1}` : label;

    const newField: RequestInputField = {
      id,
      type,
      label: finalLabel,
      value: "",
    };

    updateFields([...fields, newField]);
    setShowAddMenu(false);
  };

  const headerRightActions = !data.isSystem && (
    <div className="flex items-center gap-1">
      <div className="relative font-sans text-zinc-700" ref={menuRef}>
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors cursor-pointer text-zinc-500"
          title="Field options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showAddMenu && (
          <div className="absolute right-0 mt-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 text-xs text-zinc-700">
            <button
              onClick={() => handleAddField("text_field")}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
            >
              Add Text Field
            </button>
            <button
              onClick={() => handleAddField("image_field")}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
            >
              Add Image Field
            </button>
            <button
              onClick={() => handleAddField("video_field")}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
            >
              Add Video Field
            </button>
            <button
              onClick={() => handleAddField("audio_field")}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer"
            >
              Add Audio Field
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <NodeWrapper
      id={id}
      title="Request Inputs"
      headerRightExtra={headerRightActions}
    >
      {fields.map((field) => (
        <div
          key={field.id}
          className="relative flex flex-col gap-1.5 group/field"
        >
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
              {!data.isSystem && (
                <button
                  onClick={() => handleDelete(field.id)}
                  disabled={fields.length <= 1}
                  className={cn(
                    "p-0.5 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 cursor-pointer",
                    fields.length <= 1 &&
                      "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-zinc-400",
                  )}
                  title="Delete field"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {field.type === "text_field" ? (
            <textarea
              value={field.value}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              placeholder="Enter text..."
              className="w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-20 text-zinc-700 bg-zinc-50/20"
            />
          ) : (
            <div className="w-full font-sans text-zinc-700">
              {field.value ? (
                <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded border border-zinc-100 bg-zinc-100 shrink-0 overflow-hidden flex items-center justify-center">
                      {field.type === "image_field" ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                    <span className="text-[11px] font-medium text-zinc-600 truncate max-w-37">
                      {field.fileName ||
                        (field.type === "image_field"
                          ? "Uploaded Image"
                          : field.type === "video_field"
                            ? "Uploaded Video"
                            : "Uploaded Audio")}
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
                  variant={
                    field.type === "image_field"
                      ? "image"
                      : field.type === "video_field"
                        ? "video"
                        : "audio"
                  }
                  onChange={(url, name) => {
                    handleValueChange(field.id, url, name);
                  }}
                />
              )}
            </div>
          )}

          <Handle
            type="source"
            position={Position.Right}
            id={field.id}
            className="w-3! h-3! bg-amber-500! border-2! border-white! rounded-full! hover:scale-125! transition-transform! -mr-1.5!"
          />
        </div>
      ))}
    </NodeWrapper>
  );
}
