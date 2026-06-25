"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export function ImportButton() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

          // Strip file extension to get default workflow name
          const baseName =
            file.name.substring(0, file.name.lastIndexOf(".")) || "Imported Workflow";
          const workflowName = baseName.replace(/-workflow$/, "").replace(/[-_]+/g, " ");
          const capitalizedName =
            workflowName.charAt(0).toUpperCase() + workflowName.slice(1);

          // Call the REST API endpoint instead of a Server Action
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
        } catch (err: any) {
          alert(`Failed to import workflow: ${err.message}`);
          setIsImporting(false);
        }
      };
      reader.onerror = () => {
        alert("Failed to read file.");
        setIsImporting(false);
      };
      reader.readAsText(file);
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
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
