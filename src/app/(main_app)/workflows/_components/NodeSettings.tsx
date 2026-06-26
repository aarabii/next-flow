import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ModelInfo } from "@/config/modelConfig";

interface NodeSettingsProps {
  temperature: number;
  topP: number;
  maxTokens: number;
  model?: string;
  models?: readonly ModelInfo[];
  aspectRatio?: string;
  onChange: (updates: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    model?: string;
    aspectRatio?: string;
  }) => void;
}

export function NodeSettings({
  temperature,
  topP,
  maxTokens,
  model,
  models,
  aspectRatio,
  onChange,
}: NodeSettingsProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <div className="border-t border-zinc-100 pt-2.5">
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="w-full flex items-center justify-between text-xs font-semibold text-zinc-500 hover:text-zinc-700 cursor-pointer"
      >
        <span>Settings</span>
        {settingsOpen ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {settingsOpen && (
        <div className="flex flex-col gap-3 mt-3 text-xs text-zinc-600 bg-zinc-50/40 p-2 rounded-lg border border-zinc-100">
          {models && model && (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-[10px] text-zinc-500">
                Model
              </span>
              <select
                value={model}
                onChange={(e) => onChange({ model: e.target.value })}
                className="w-full text-xs p-1.5 border border-zinc-200 rounded text-zinc-700 bg-white nodrag"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {aspectRatio !== undefined && (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-[10px] text-zinc-500">
                Aspect Ratio
              </span>
              <select
                value={aspectRatio}
                onChange={(e) => onChange({ aspectRatio: e.target.value })}
                className="w-full text-xs p-1.5 border border-zinc-200 rounded text-zinc-700 bg-white nodrag"
              >
                <option value="1:1">1:1 (Square)</option>
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="9:16">9:16 (Vertical)</option>
                <option value="4:3">4:3 (Landscape)</option>
                <option value="3:4">3:4 (Portrait)</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex justify-between font-mono text-[10px]">
              <span>Temperature</span>
              <span>{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) =>
                onChange({ temperature: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-purple-500 nodrag"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between font-mono text-[10px]">
              <span>Top P</span>
              <span>{topP}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={topP}
              onChange={(e) => onChange({ topP: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-purple-500 nodrag"
            />
          </div>

          <div className="flex justify-between items-center mt-1">
            <span>Max Tokens</span>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) =>
                onChange({ maxTokens: parseInt(e.target.value) || 1 })
              }
              className="w-16 p-1 border border-zinc-200 rounded text-right font-mono text-[11px] nodrag"
            />
          </div>
        </div>
      )}
    </div>
  );
}
