"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";

export function ImportButton() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          if (!parsed || typeof parsed !== "object") {
            throw new Error("Invalid JSON file format.");
          }

          if (!Array.isArray(parsed.nodes)) {
            throw new Error("Missing or invalid 'nodes' array in JSON.");
          }

          let generationCount = 0;

          const rawNodesList = parsed.nodes as Record<string, unknown>[];
          const cleanedNodes = rawNodesList.map((node) => {
            if (!node || typeof node !== "object") return node;

            const cleanedNode = { ...node };

            const rawPosition = cleanedNode.position as
              | Record<string, unknown>
              | undefined;
            if (
              !rawPosition ||
              typeof rawPosition.x !== "number" ||
              typeof rawPosition.y !== "number"
            ) {
              if (cleanedNode.type === "requestInput") {
                cleanedNode.position = { x: 50, y: 150 };
              } else if (cleanedNode.type === "response") {
                cleanedNode.position = { x: 950, y: 250 };
              } else {
                cleanedNode.position = {
                  x: 350 + (generationCount % 2) * 280,
                  y: 150 + Math.floor(generationCount / 2) * 220,
                };
                generationCount++;
              }
            }

            const data = {
              ...((cleanedNode.data as Record<string, unknown>) || {}),
            };
            const type = cleanedNode.type as string;

            if (type === "textNode") {
              const config = GEMINI_MODEL_CONFIG.textNode;
              data.model = data.model || config.defaultModelId;
              data.temperature =
                data.temperature !== undefined
                  ? Number(data.temperature)
                  : config.defaultTemperature;
              data.topP =
                data.topP !== undefined
                  ? Number(data.topP)
                  : config.defaultTopP;
              data.maxTokens =
                data.maxTokens !== undefined
                  ? Number(data.maxTokens)
                  : config.defaultMaxTokens;
              data.systemPrompt =
                data.systemPrompt !== undefined
                  ? data.systemPrompt
                  : "You are a helpful text generator assistant. Provide concise and accurate text responses.";
              if (!data.fields && !data.prompt) {
                data.fields = [
                  {
                    id: "prompt",
                    type: "text_field",
                    label: "Prompt",
                    value: "",
                  },
                ];
              }
            } else if (type === "imageNode") {
              const config = GEMINI_MODEL_CONFIG.imageNode;
              data.model = data.model || config.defaultModelId;
              data.temperature =
                data.temperature !== undefined
                  ? Number(data.temperature)
                  : config.defaultTemperature;
              data.topP =
                data.topP !== undefined
                  ? Number(data.topP)
                  : config.defaultTopP;
              data.maxTokens =
                data.maxTokens !== undefined
                  ? Number(data.maxTokens)
                  : config.defaultMaxTokens;
              data.systemPrompt =
                data.systemPrompt !== undefined
                  ? data.systemPrompt
                  : "Describe a detailed visual scene based on the input.";
              data.aspectRatio = data.aspectRatio || "1:1";
              if (!data.fields && !data.prompt) {
                data.fields = [
                  {
                    id: "prompt",
                    type: "text_field",
                    label: "Prompt",
                    value: "",
                  },
                ];
              }
            } else if (type === "videoNode") {
              const config = GEMINI_MODEL_CONFIG.videoNode;
              data.model = data.model || config.defaultModelId;
              data.temperature =
                data.temperature !== undefined
                  ? Number(data.temperature)
                  : config.defaultTemperature;
              data.topP =
                data.topP !== undefined
                  ? Number(data.topP)
                  : config.defaultTopP;
              data.maxTokens =
                data.maxTokens !== undefined
                  ? Number(data.maxTokens)
                  : config.defaultMaxTokens;
              data.systemPrompt =
                data.systemPrompt !== undefined
                  ? data.systemPrompt
                  : "You are a video scene writer. Outline a continuous video description sequence based on the input.";
              if (!data.fields && !data.prompt) {
                data.fields = [
                  {
                    id: "prompt",
                    type: "text_field",
                    label: "Prompt",
                    value: "",
                  },
                ];
              }
            } else if (type === "audioNode") {
              const config = GEMINI_MODEL_CONFIG.audioNode;
              data.model = data.model || config.defaultModelId;
              data.temperature =
                data.temperature !== undefined
                  ? Number(data.temperature)
                  : config.defaultTemperature;
              data.topP =
                data.topP !== undefined
                  ? Number(data.topP)
                  : config.defaultTopP;
              data.maxTokens =
                data.maxTokens !== undefined
                  ? Number(data.maxTokens)
                  : config.defaultMaxTokens;
              data.systemPrompt =
                data.systemPrompt !== undefined
                  ? data.systemPrompt
                  : "You are a speech narrator. Write standard speech-to-text narrations.";
              if (!data.fields && !data.prompt) {
                data.fields = [
                  {
                    id: "prompt",
                    type: "text_field",
                    label: "Prompt",
                    value: "",
                  },
                ];
              }
            } else if (type === "cropImage") {
              data.x = data.x !== undefined ? Number(data.x) : 0;
              data.y = data.y !== undefined ? Number(data.y) : 0;
              data.width = data.width !== undefined ? Number(data.width) : 100;
              data.height =
                data.height !== undefined ? Number(data.height) : 100;
              data.inputImage = data.inputImage || "";
              data.outputImage = data.outputImage || "";
            }

            cleanedNode.data = data;
            return cleanedNode;
          });

          const baseName =
            file.name.substring(0, file.name.lastIndexOf(".")) ||
            "Imported Workflow";
          const workflowName = baseName
            .replace(/-workflow$/, "")
            .replace(/[-_]+/g, " ");
          const capitalizedName =
            workflowName.charAt(0).toUpperCase() + workflowName.slice(1);

          const response = await fetch("/api/workflows/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: capitalizedName,
              nodes: cleanedNodes,
              edges: parsed.edges || [],
            }),
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Failed to import workflow");
          }

          const workflow = await response.json();
          router.push(`/workflows/${workflow.id}`);
        } catch (err) {
          alert(
            `Failed to import workflow: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
          setIsImporting(false);
        }
      };
      reader.onerror = () => {
        alert("Failed to read file.");
        setIsImporting(false);
      };
      reader.readAsText(file);
    } catch (err) {
      alert(
        `Import error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setIsImporting(false);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isImporting}
        className="inline-flex h-9 items-center gap-space-03 rounded-radius-l bg-surface-primary px-space-04 text-button text-text-primary transition-colors hover:bg-surface-secondary disabled:opacity-40 cursor-pointer"
        title="Import workflow JSON"
      >
        <Upload className="w-4 h-4 text-icon-primary" aria-hidden="true" />
        {isImporting ? "Importing..." : "Import"}
      </button>
    </>
  );
}
