"use client";

import * as React from "react";
import {
  Plus,
  ArrowUp,
  FileText,
  Scissors,
  X,
  Paperclip,
  ImageIcon,
  Music,
  Video,
  Loader2,
  Play,
  Layers,
  Sparkles,
  Image as BgImage,
  Zap,
} from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import {
  MessageGroup,
  Message,
  MessageContent,
} from "@/components/ui/message";
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import type { MediaFileAttachment } from "@/lib/workflow-tools/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mediaFiles?: MediaFileAttachment[];
  createdAt?: string;
}

export interface WorkflowChatBarProps {
  workflowId: string;
  onAddNode: (nodeType: "textNode" | "cropImage") => void;
  onWorkflowUpdated?: (nodes: Node[], edges: Edge[]) => void;
  onRunWorkflow?: (runId: string) => void;
  onBackgroundUpdated?: (imageUrl: string) => void;
  onNameUpdated?: (name: string) => void;
  className?: string;
}

interface UploadingFileState {
  name: string;
  size?: string;
  type: string;
  state: "uploading" | "done" | "error";
  url?: string;
}

const SLASH_COMMANDS = [
  {
    command: "/create",
    title: "Create Workflow",
    description: "Generate or update a complete workflow graph from prompt",
    icon: Sparkles,
    template: "/create ",
  },
  {
    command: "/name",
    title: "Generate Name",
    description: "Use AI to generate a creative title for this workflow",
    icon: Sparkles,
    template: "/name ",
  },
  {
    command: "/run",
    title: "Run Workflow",
    description: "Execute the entire workflow or a specific node",
    icon: Play,
    template: "/run ",
  },
  {
    command: "/attach",
    title: "Attach Media",
    description: "Attach uploaded image/audio/video to a node",
    icon: Paperclip,
    template: "/attach ",
  },
  {
    command: "/background",
    title: "Set Background",
    description: "Set or update the workflow card background image",
    icon: BgImage,
    template: "/background ",
  },
];

export function WorkflowChatBar({
  workflowId,
  onAddNode,
  onWorkflowUpdated,
  onRunWorkflow,
  onBackgroundUpdated,
  onNameUpdated,
  className,
}: WorkflowChatBarProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputMessage, setInputMessage] = React.useState("");
  const [isAssistantTyping, setIsAssistantTyping] = React.useState(false);
  const [activeUploads, setActiveUploads] = React.useState<UploadingFileState[]>([]);
  const [attachedFiles, setAttachedFiles] = React.useState<MediaFileAttachment[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = React.useState(0);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target &&
        !containerRef.current.contains(event.target as globalThis.Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Show slash menu if input starts with '/'
  const showSlashMenu = inputMessage.startsWith("/");
  const filteredCommands = React.useMemo(() => {
    if (!showSlashMenu) return [];
    const query = inputMessage.toLowerCase();
    return SLASH_COMMANDS.filter(
      (cmd) =>
        cmd.command.toLowerCase().startsWith(query) ||
        cmd.title.toLowerCase().includes(query.slice(1)),
    );
  }, [showSlashMenu, inputMessage]);

  React.useEffect(() => {
    let isMounted = true;
    async function loadMessages() {
      try {
        const res = await fetch(`/api/workflows/${workflowId}/chat`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error("Failed to load workflow messages:", err);
      }
    }
    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [workflowId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
    const uploadId = file.name + Date.now();

    setActiveUploads((prev) => [
      ...prev,
      {
        name: file.name,
        size: fileSizeStr,
        type: file.type || "image/png",
        state: "uploading",
      },
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      if (data.url) {
        setAttachedFiles((prev) => [
          ...prev,
          {
            url: data.url,
            name: file.name,
            type: file.type || "image/png",
          },
        ]);
        setActiveUploads((prev) =>
          prev.filter((u) => u.name !== file.name),
        );
      }
    } catch (err) {
      console.error("Failed to upload media attachment:", err);
      setActiveUploads((prev) =>
        prev.map((u) =>
          u.name === file.name ? { ...u, state: "error" as const } : u,
        ),
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeActiveUpload = (index: number) => {
    setActiveUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const selectCommand = (cmd: typeof SLASH_COMMANDS[0]) => {
    setInputMessage(cmd.template);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSlashMenu && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter" && !e.shiftKey) {
        if (filteredCommands[selectedCommandIndex]) {
          e.preventDefault();
          selectCommand(filteredCommands[selectedCommandIndex]);
        }
      }
    }
  };

  const handleSendMessage = React.useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmed = inputMessage.trim();
      if (
        (!trimmed && attachedFiles.length === 0) ||
        isAssistantTyping ||
        activeUploads.some((u) => u.state === "uploading")
      ) {
        return;
      }

      const currentAttachments = [...attachedFiles];
      const messageText = trimmed || (currentAttachments.length > 0 ? "Attached media file." : "");

      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: messageText,
        mediaFiles: currentAttachments,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputMessage("");
      setAttachedFiles([]);
      setIsOpen(true);
      setIsAssistantTyping(true);

      try {
        const res = await fetch(`/api/workflows/${workflowId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            mediaFiles: currentAttachments,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to process request (${res.status})`);
        }

        const data = await res.json();

        const assistantMsg: ChatMessage = {
          id: data.message?.id || `msg-${Date.now()}`,
          role: "assistant",
          content: data.reply || "Workflow processed.",
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (
          data.nodes &&
          Array.isArray(data.nodes) &&
          data.nodes.length > 0 &&
          onWorkflowUpdated
        ) {
          onWorkflowUpdated(data.nodes as Node[], (data.edges || []) as Edge[]);
        }

        if (data.runId && onRunWorkflow) {
          onRunWorkflow(data.runId);
        }

        if (data.backgroundImage && onBackgroundUpdated) {
          onBackgroundUpdated(data.backgroundImage);
        }

        if (data.name && onNameUpdated) {
          onNameUpdated(data.name);
        }
      } catch (error) {
        console.error("Error communicating with workflow AI:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Sorry, I encountered an error while processing your request. Please try again.";
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: errorMessage,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsAssistantTyping(false);
      }
    },
    [
      inputMessage,
      attachedFiles,
      isAssistantTyping,
      activeUploads,
      workflowId,
      onWorkflowUpdated,
      onRunWorkflow,
      onBackgroundUpdated,
      onNameUpdated,
    ],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute bottom-3 sm:bottom-6 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-full sm:w-[580px] px-3 sm:px-0 flex flex-col items-center gap-2 z-40",
        className,
      )}
    >
      {/* Message Scroller History Box */}
      {messages.length > 0 && isOpen && (
        <div className="w-full max-h-64 sm:max-h-72 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Describe your workflow
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <MessageScrollerProvider>
            <MessageScroller className="h-full min-h-[100px] max-h-52">
              <MessageScrollerViewport className="p-1">
                <MessageScrollerContent className="gap-2">
                  <MessageGroup className="gap-2.5">
                    {messages.map((msg, index) => (
                      <MessageScrollerItem
                        key={msg.id}
                        scrollAnchor={index === messages.length - 1}
                      >
                        <Message align={msg.role === "user" ? "end" : "start"}>
                          <MessageContent>
                            <div
                              className={cn(
                                "px-3.5 py-2 text-sm rounded-2xl leading-relaxed select-text shadow-xs",
                                msg.role === "user"
                                  ? "bg-purple-600 text-white rounded-tr-xs"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/70 dark:border-zinc-700/70 rounded-tl-xs",
                              )}
                            >
                              {msg.content}
                            </div>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    ))}
                    {isAssistantTyping && (
                      <MessageScrollerItem scrollAnchor={true}>
                        <Message align="start">
                          <MessageContent>
                            <div className="px-3.5 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200/70 dark:border-zinc-700/70 rounded-2xl rounded-tl-xs shadow-xs animate-pulse">
                              Processing workflow action...
                            </div>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    )}
                  </MessageGroup>
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton direction="end" />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>
      )}

      {/* Slash Command Dropdown Menu */}
      {showSlashMenu && filteredCommands.length > 0 && (
        <div className="w-full bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider select-none">
            Workflow Tools & Commands
          </div>
          {filteredCommands.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedCommandIndex;
            return (
              <button
                key={cmd.command}
                type="button"
                onClick={() => selectCommand(cmd)}
                onMouseEnter={() => setSelectedCommandIndex(idx)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer border-0",
                  isSelected
                    ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                    isSelected
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{cmd.title}</span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {cmd.command}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate">
                    {cmd.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,audio/*,video/*"
        className="hidden"
      />

      {/* Input Container */}
      <div className="w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1.5 pl-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl flex flex-col gap-1.5">
        {/* Shadcn Attachment Previews (Uploading & Done States) */}
        {(activeUploads.length > 0 || attachedFiles.length > 0) && (
          <AttachmentGroup className="px-1 pt-1">
            {/* Uploading Attachments */}
            {activeUploads.map((upload, idx) => (
              <Attachment
                key={`uploading-${idx}`}
                size="sm"
                state={upload.state === "error" ? "error" : "uploading"}
                className="bg-zinc-50/80 dark:bg-zinc-800/80"
              >
                <AttachmentMedia variant="icon">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{upload.name}</AttachmentTitle>
                  <AttachmentDescription>
                    {upload.state === "error" ? "Failed to upload" : "Uploading file..."}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    onClick={() => removeActiveUpload(idx)}
                    title="Cancel"
                  >
                    <X className="w-3 h-3" />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}

            {/* Completed Attachments */}
            {attachedFiles.map((file, idx) => (
              <Attachment
                key={`attached-${idx}`}
                size="sm"
                state="done"
                className="bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60"
              >
                <AttachmentMedia
                  variant={file.type.startsWith("image") ? "image" : "icon"}
                >
                  {file.type.startsWith("image") ? (
                    <img
                      src={file.url}
                      alt={file.name || "Preview"}
                      className="w-full h-full object-cover"
                    />
                  ) : file.type.startsWith("audio") ? (
                    <Music className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Video className="w-3.5 h-3.5 text-blue-500" />
                  )}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle className="text-zinc-800 dark:text-zinc-200">
                    {file.name || "Media File"}
                  </AttachmentTitle>
                  <AttachmentDescription className="text-purple-600 dark:text-purple-400">
                    Ready to attach
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    onClick={() => removeAttachedFile(idx)}
                    title="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </AttachmentGroup>
        )}

        {/* Form Controls */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-1.5 w-full"
        >
          {/* Add Node Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="add-node-button"
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-zinc-600 hover:text-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 shrink-0 cursor-pointer transition-transform active:scale-95"
                title="Add Node"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={12}
              className="w-64 p-2 rounded-2xl shadow-2xl bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 animate-in fade-in-0 zoom-in-95"
            >
              <DropdownMenuLabel className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1 select-none">
                Add Node
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onAddNode("textNode")}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-purple-50/60 dark:hover:bg-purple-950/40 group transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-purple-600 transition-colors">
                    Text Node
                  </span>
                  <span className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Gemini model text outputs
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAddNode("cropImage")}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-purple-50/60 dark:hover:bg-purple-950/40 group transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Scissors className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-purple-600 transition-colors">
                    Crop Node
                  </span>
                  <span className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Crop via FFmpeg parameters
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Media Upload Button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={activeUploads.some((u) => u.state === "uploading")}
            className="h-8 w-8 rounded-full text-zinc-500 hover:text-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 shrink-0 cursor-pointer transition-transform active:scale-95"
            title="Attach Media (Image, Audio, Video)"
          >
            {activeUploads.some((u) => u.state === "uploading") ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>

          {/* Text Input with Click / Focus Auto-Open */}
          <Input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onFocus={() => {
              if (messages.length > 0) setIsOpen(true);
            }}
            onClick={() => {
              if (messages.length > 0) setIsOpen(true);
            }}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type / to use tools, or describe your workflow..."
            className="flex-1 h-8 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            disabled={
              (!inputMessage.trim() && attachedFiles.length === 0) ||
              isAssistantTyping ||
              activeUploads.some((u) => u.state === "uploading")
            }
            className="h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 disabled:hover:bg-purple-600 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm"
            title="Send Message"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
