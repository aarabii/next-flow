"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderOpen, Pencil, Trash2, EllipsisVertical } from "lucide-react";
import React from "react";

export interface WorkflowActionHandlers {
  onOpen?: (id: string) => void;
  onRename?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export interface WorkflowActionsDropdownProps {
  workflowId: string;
  workflowTitle: string;
  handlers?: WorkflowActionHandlers;
  triggerClassName?: string;
}

export const WorkflowActionsDropdown = ({
  workflowId,
  workflowTitle,
  handlers,
  triggerClassName,
}: WorkflowActionsDropdownProps) => {
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (handlers?.onOpen) {
      handlers.onOpen(workflowId);
    }
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (handlers?.onRename) {
      handlers.onRename(workflowId);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (handlers?.onDelete) {
      handlers.onDelete(workflowId);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${workflowTitle}`}
          className={triggerClassName}
        >
          <EllipsisVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleOpen} className="cursor-pointer">
          <FolderOpen className="mr-2 h-4 w-4" />
          <span>Open</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRename} className="cursor-pointer">
          <Pencil className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          variant="destructive"
          className="cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
