"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
              nodes: parsed.nodes,
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
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={isImporting}
        className="cursor-pointer rounded-md bg-slate-100"
        title="Import workflow JSON"
      >
        <Upload className="w-4 h-4" aria-hidden="true" />
        <span>{isImporting ? "Importing..." : "Import"}</span>
      </Button>
    </>
  );
}
