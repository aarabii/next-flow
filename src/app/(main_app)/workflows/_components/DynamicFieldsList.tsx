"use client";

import * as React from "react";
import { Position } from "@xyflow/react";
import { RequestInputField } from "@/types/node.type";
import { DynamicFieldItem } from "./DynamicFieldItem";

interface DynamicFieldsListProps {
  fields: RequestInputField[];
  isLocked: boolean;
  isConnected: (handleId: string) => boolean;
  onValueChange: (
    fieldId: string,
    value: string,
    fileName?: string,
    fileSize?: string
  ) => void;
  onDeleteField: (fieldId: string) => void;
  handleType?: "source" | "target";
  handlePosition?: Position;
}

export function DynamicFieldsList({
  fields,
  isLocked,
  isConnected,
  onValueChange,
  onDeleteField,
  handleType,
  handlePosition,
}: DynamicFieldsListProps) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => (
        <DynamicFieldItem
          key={field.id}
          field={field}
          isLocked={isLocked}
          isConnected={isConnected(field.id)}
          onValueChange={onValueChange}
          onDelete={onDeleteField}
          handleType={handleType}
          handlePosition={handlePosition}
        />
      ))}
    </div>
  );
}
