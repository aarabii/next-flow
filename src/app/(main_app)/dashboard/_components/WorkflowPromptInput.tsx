"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  FileSearch,
  PenTool,
  AudioLines,
  Share2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  {
    id: "social",
    label: "Social Media Studio",
    icon: Share2,
    prompt:
      "Create a workflow with an Image input, a Crop Image node to crop for Instagram, and a Gemini Text node to generate engaging post captions.",
  },
  {
    id: "document",
    label: "Visual Document Auditor",
    icon: FileSearch,
    prompt:
      "Create an image analysis workflow that takes an architectural or UI diagram, inspects it with Gemini Vision, and outputs a detailed critique.",
  },
  {
    id: "content",
    label: "Content & Blog Pipeline",
    icon: PenTool,
    prompt:
      "Create a workflow with text inputs for topic and audience, connecting to Gemini to write a structured article draft and summary points.",
  },
  {
    id: "audio",
    label: "Audio Transcribe & Notes",
    icon: AudioLines,
    prompt:
      "Create an audio processing workflow that takes a voice memo, transcribes speech with Gemini, and outputs meeting action items.",
  },
];

export function WorkflowPromptInput() {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleGenerate = async (targetPrompt?: string) => {
    const textToSubmit = (targetPrompt || prompt).trim();
    if (!textToSubmit || isPending) return;

    setIsPending(true);
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: textToSubmit }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow with AI");
      }

      const workflow = await response.json();
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      console.error("Error creating workflow with prompt:", error);
      alert("Failed to create workflow. Please try again.");
      setIsPending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Only fills in the input box and focuses it, allowing the user to edit before submitting
  const handlePillClick = (starterPrompt: string) => {
    setPrompt(starterPrompt);
    setTimeout(() => {
      inputRef.current?.focus();
      // Move cursor to the end
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.value.length;
        inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }, 50);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-3">
      {/* Main Square/Rectangular Prompt Card */}
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-md p-3 sm:p-3.5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
        <div className="flex items-center gap-3">
          {/* Text Input Container */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 select-none hidden sm:block">
              What do you want to build today?
            </div>
            <Input
              ref={inputRef}
              type="text"
              value={prompt}
              disabled={isPending}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your workflow in natural language..."
              className="h-7 text-xs sm:text-sm bg-transparent border-0 shadow-none px-0 rounded-none focus-visible:ring-0 placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Square Action Submit Button */}
          <button
            type="button"
            disabled={isPending || !prompt.trim()}
            onClick={() => handleGenerate()}
            title="Create workflow (Enter)"
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-all cursor-pointer border-0",
              prompt.trim()
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Starter Suggestions Square Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 select-none">
        {STARTER_PROMPTS.map((item) => {
          const Icon = item.icon;
          const isSelected = prompt === item.prompt;
          return (
            <button
              key={item.id}
              type="button"
              disabled={isPending}
              onClick={() => handlePillClick(item.prompt)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-md transition-all cursor-pointer shadow-2xs disabled:opacity-50",
                isSelected
                  ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300",
              )}
            >
              <Icon className="w-3.5 h-3.5 text-zinc-500" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
