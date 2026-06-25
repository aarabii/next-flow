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
    defaultModelId: "gemini-2.5-flash",
    defaultTemperature: 0.7,
    defaultTopP: 0.95,
    defaultMaxTokens: 2048,
    models: [
      { name: "Gemini 2.5 Flash (Recommended)", id: "gemini-2.5-flash" },
      { name: "Gemini 2.5 Flash Lite (Fastest)", id: "gemini-2.5-flash-lite" },
      { name: "Gemini 2.5 Pro (Most Capable)", id: "gemini-2.5-pro" },
    ],
  },
  imageNode: {
    name: "Image Generation",
    defaultModelId: "gemini-2.5-flash-image",
    defaultTemperature: 1.0,
    defaultTopP: 0.95,
    defaultMaxTokens: 2048,
    models: [
      { name: "Gemini 2.5 Flash Image", id: "gemini-2.5-flash-image" },
    ],
  },
  videoNode: {
    name: "Video Generation",
    defaultModelId: "gemini-2.5-flash",
    defaultTemperature: 0.7,
    defaultTopP: 0.95,
    defaultMaxTokens: 2048,
    models: [
      { name: "Gemini 2.5 Flash (Recommended)", id: "gemini-2.5-flash" },
      { name: "Gemini 2.5 Flash Lite (Fastest)", id: "gemini-2.5-flash-lite" },
    ],
  },
  audioNode: {
    name: "Audio Generation",
    defaultModelId: "gemini-2.5-flash",
    defaultTemperature: 0.7,
    defaultTopP: 0.95,
    defaultMaxTokens: 2048,
    models: [
      { name: "Gemini 2.5 Flash (Recommended)", id: "gemini-2.5-flash" },
      { name: "Gemini 2.5 Flash Lite (Fastest)", id: "gemini-2.5-flash-lite" },
    ],
  },
} as const;

export type WorkflowNodeType = keyof typeof GEMINI_MODEL_CONFIG;
