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
  imageNode: {
    name: "Image Generation",
    defaultModelId: "gemini-2.5-flash-image",
    defaultTemperature: 1.0,
    defaultTopP: 0.95,
    defaultMaxTokens: 2048,
    models: [
      {
        name: "Gemini 2.5 Flash Image (Nano Banana)",
        id: "gemini-2.5-flash-image",
      },
      {
        name: "Gemini 3 Pro Image (Nano Banana Pro)",
        id: "gemini-3-pro-image",
      },
      {
        name: "Gemini 3.1 Flash Image (Nano Banana 2)",
        id: "gemini-3.1-flash-image",
      },
    ],
  },
  videoNode: {
    name: "Video Generation",
    defaultModelId: "veo-3.1-lite-generate-preview",
    defaultTemperature: 0.7,
    defaultTopP: 0.95,
    defaultMaxTokens: 2048,
    models: [
      { name: "Veo 3.1 Lite Preview", id: "veo-3.1-lite-generate-preview" },
      { name: "Veo 3.1", id: "veo-3.1-generate-preview" },
      { name: "Veo 3.1 Fast Preview", id: "veo-3.1-fast-generate-preview" },
    ],
  },
  audioNode: {
    name: "Audio Generation",
    defaultModelId: "gemini-2.5-flash-preview-tts",
    defaultTemperature: 0.7,
    defaultTopP: 0.95,
    defaultMaxTokens: 2048,
    models: [
      {
        name: "Gemini 3.1 Flash Live Preview",
        id: "gemini-3.1-flash-live-preview",
      },
      {
        name: "Gemini 2.5 Pro Text-to-Speech",
        id: "gemini-2.5-pro-preview-tts",
      },
      {
        name: "Gemini 3.1 Flash TTS (Text-to-Speech) Preview",
        id: "gemini-3.1-flash-tts-preview",
      },
      {
        name: "Gemini 2.5 Flash Text-to-Speech",
        id: "gemini-2.5-flash-preview-tts",
      },
    ],
  },
} as const;

export type WorkflowNodeType = keyof typeof GEMINI_MODEL_CONFIG;
