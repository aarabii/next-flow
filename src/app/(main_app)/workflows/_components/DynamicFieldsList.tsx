"use client";

import * as React from "react";
import { Handle, Position } from "@xyflow/react";
import { Trash2, Video as VideoIcon, Music as MusicIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RequestInputField } from "@/types/node.type";
import { UploadButton } from "./UploadButton";

interface DynamicFieldsListProps {
  fields: RequestInputField[];
  isConnected: (handleId: string) => boolean;
  onValueChange: (fieldId: string, value: string, fileName?: string) => void;
  onDeleteField: (fieldId: string) => void;
  isSystem?: boolean;
}

export function DynamicFieldsList({
  fields,
  isConnected,
  onValueChange,
  onDeleteField,
  isSystem,
}: DynamicFieldsListProps) {
  return (
    <>
      {fields.map((field) => (
        <div key={field.id} className="relative flex flex-col gap-1.5 group/field">
          {/* Field Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
              {field.label}
            </span>
            {!isSystem && (
              <div className="flex items-center gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity">
                <button
                  onClick={() => onDeleteField(field.id)}
                  disabled={fields.length <= 1}
                  className={cn(
                    "p-0.5 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 cursor-pointer",
                    fields.length <= 1 &&
                      "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-zinc-400"
                  )}
                  title="Delete field"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Field Input Area */}
          {field.type === "text_field" ? (
            <div className="relative">
              <Handle
                type="target"
                position={Position.Left}
                id={field.id}
                className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5"
              />
              <textarea
                value={field.value}
                onChange={(e) => onValueChange(field.id, e.target.value)}
                disabled={isConnected(field.id)}
                placeholder={
                  isConnected(field.id) ? "Linked to upstream source..." : "Enter text..."
                }
                className={cn(
                  "w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none h-20 text-zinc-700 bg-zinc-50/20",
                  isConnected(field.id) && "bg-zinc-50 text-zinc-400 italic"
                )}
              />
            </div>
          ) : (
            <div className="w-full font-sans text-zinc-700 relative">
              <Handle
                type="target"
                position={Position.Left}
                id={field.id}
                className={cn(
                  "!w-3 !h-3 !border-2 !border-white !rounded-full hover:!scale-125 !transition-transform !-ml-1.5",
                  field.type === "image_field" ? "!bg-blue-500" : "!bg-purple-500"
                )}
              />
              <div
                className={cn(
                  "w-full",
                  isConnected(field.id) && "opacity-60 pointer-events-none"
                )}
              >
                {isConnected(field.id) ? (
                  <div className="border border-zinc-100 rounded-lg p-2.5 bg-zinc-50 text-xs text-zinc-400 italic">
                    Linked to upstream source
                  </div>
                ) : field.value ? (
                  <div className="border border-zinc-200 rounded-lg p-2 flex items-center justify-between bg-zinc-50/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded border border-zinc-100 bg-zinc-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {field.type === "image_field" ? (
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
                      <span className="text-[11px] font-medium text-zinc-600 truncate max-w-[150px]">
                        {field.fileName || (field.type === "image_field" ? "Uploaded Image" : field.type === "video_field" ? "Uploaded Video" : "Uploaded Audio")}
                      </span>
                    </div>
                    <button
                      onClick={() => onValueChange(field.id, "", "")}
                      className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-zinc-400 cursor-pointer transition-colors"
                      title="Clear file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <UploadButton
                    variant={field.type === "image_field" ? "image" : field.type === "video_field" ? "video" : "audio"}
                    onChange={(url, name) => {
                      onValueChange(field.id, url, name);
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
