export interface ModelInfo {
  name: string;
  id: string;
}

export interface NodeModelConfig {
  name: string;
  defaultModelId: string;
  defaultTemperature: number;
  defaultTopP: number;
  defaultMaxTokens: number;
  models: ModelInfo[];
}

export const GEMINI_MODEL_CONFIG = {
  textNode: {
    name: "Text Generation",
    defaultModelId: "gemini-3.1-flash-lite",
    defaultTemperature: 0.7,
    defaultTopP: 0.95,
    defaultMaxTokens: 2048,
    models: [
      { name: "Gemini 3.1 Pro Preview", id: "gemini-3.1-pro-preview" },
      { name: "Gemini 3.5 Flash", id: "gemini-3.5-flash" },
      { name: "Gemini 3 Flash Preview", id: "gemini-3-flash-preview" },
      {
        name: "Gemini 3.1 Flash-Lite",
        id: "gemini-3.1-flash-lite",
      },
      {
        name: "Gemini 2.5 Flash",
        id: "gemini-2.5-flash",
      },
      {
        name: "Gemini 2.5 Flash-Lite",
        id: "gemini-2.5-flash-lite",
      },
      {
        name: "Gemini 2.5 Pro",
        id: "gemini-2.5-pro",
      },
    ],
  },

} as const;

export type WorkflowNodeType = keyof typeof GEMINI_MODEL_CONFIG;
