// Centralized configuration for the Gemini model used across all nodes in the workflows.
export const GEMINI_MODEL_CONFIG = {
  name: "Gemini 2.5 Flash",
  modelId: "gemini-2.5-flash",
  models: [
    { name: "Gemini 2.5 Flash (Recommended)", id: "gemini-2.5-flash" },
    { name: "Gemini 2.5 Flash Lite (Fastest)", id: "gemini-2.5-flash-lite" },
  ]
};
