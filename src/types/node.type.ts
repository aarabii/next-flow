export interface RequestInputField {
  id: string;
  type: "text_field" | "image_field";
  label: string;
  value: string;
  fileName?: string;
}

export interface RequestInputNodeData {
  fields?: RequestInputField[];
  onChange?: (id: string, updatedData: Partial<RequestInputNodeData>) => void;
}

export interface CropImageNodeData {
  inputImage?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  outputImage?: string;
  connectedInputs?: string[];
  onChange?: (id: string, updatedData: Partial<CropImageNodeData>) => void;
}

export interface GeminiImageField {
  id: string;
  value: string;
  fileName?: string;
}

export interface GeminiNodeData {
  model?: string;
  prompt?: string;
  promptEnabled?: boolean;
  systemPrompt?: string;
  systemPromptEnabled?: boolean;
  images?: GeminiImageField[];
  video?: string;
  videoFileName?: string;
  videoEnabled?: boolean;
  audio?: string;
  audioFileName?: string;
  audioEnabled?: boolean;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  connectedInputs?: string[];
  onChange?: (id: string, updatedData: Partial<GeminiNodeData>) => void;
}

export interface TextNodeData {
  prompt?: string;
  systemPrompt?: string;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  connectedInputs?: string[];
  onChange?: (id: string, updatedData: Partial<TextNodeData>) => void;
}

export interface ImageNodeData {
  prompt?: string;
  systemPrompt?: string;
  imageInput?: string;
  imageInputFileName?: string;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  connectedInputs?: string[];
  onChange?: (id: string, updatedData: Partial<ImageNodeData>) => void;
}

export interface VideoNodeData {
  prompt?: string;
  systemPrompt?: string;
  imageInput?: string;
  imageInputFileName?: string;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  connectedInputs?: string[];
  onChange?: (id: string, updatedData: Partial<VideoNodeData>) => void;
}

export interface AudioNodeData {
  prompt?: string;
  systemPrompt?: string;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  connectedInputs?: string[];
  onChange?: (id: string, updatedData: Partial<AudioNodeData>) => void;
}

export interface ResponseResultItem {
  nodeId: string;
  edgeId: string;
  sourceHandleId?: string | null;
  label: string;
  value?: string;
  type?: "image" | "video" | "audio" | "text";
}

export interface ResponseNodeData {
  results?: ResponseResultItem[];
  onDeleteConnection?: (edgeId: string) => void;
}

export type CustomNodeData =
  | RequestInputNodeData
  | CropImageNodeData
  | GeminiNodeData
  | TextNodeData
  | ImageNodeData
  | VideoNodeData
  | AudioNodeData
  | ResponseNodeData;
