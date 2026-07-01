import type { Node } from "@xyflow/react";

export interface RequestInputField {
  id: string;
  type: "text_field" | "image_field" | "video_field" | "audio_field";
  label: string;
  value: string;
  fileName?: string;
  fileSize?: string;
}

export interface BaseWorkflowNodeData<T = Record<string, unknown>> {
  connectedInputs?: string[];
  onChange?: (id: string, updatedData: Partial<T>) => void;
  onRunNode?: () => void;
  running?: boolean;
  onDeleteNode?: () => void;
  isLocked?: boolean;
  isPositionLocked?: boolean;
  description?: string;
  [key: string]: unknown;
}

export interface RequestInputNodeData extends BaseWorkflowNodeData<RequestInputNodeData> {
  fields?: RequestInputField[];
}

export interface CropImageNodeData extends BaseWorkflowNodeData<CropImageNodeData> {
  inputImage?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  outputImage?: string;
}

export interface TextNodeData extends BaseWorkflowNodeData<TextNodeData> {
  model?: string;
  prompt?: string;
  systemPrompt?: string;
  imageInput?: string;
  imageInputFileName?: string;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  reasoning?: string;
  topK?: number;
  isLocked?: boolean;
  expandResponse?: boolean;
  fields?: RequestInputField[];
}

export interface ResponseResultItem {
  nodeId: string;
  edgeId: string;
  sourceHandleId?: string | null;
  label: string;
  value?: string;
  type?: "image" | "video" | "audio" | "text";
  fileName?: string;
  fileSize?: string;
}

export interface ResponseNodeData extends BaseWorkflowNodeData<ResponseNodeData> {
  results?: ResponseResultItem[];
  onDeleteConnection?: (edgeId: string) => void;
}

export type CustomNodeData =
  | RequestInputNodeData
  | CropImageNodeData
  | TextNodeData
  | ResponseNodeData;

export type RequestInputNode = Node<RequestInputNodeData, "requestInput">;
export type CropImageNode = Node<CropImageNodeData, "cropImage">;
export type TextNode = Node<TextNodeData, "textNode">;
export type ResponseNode = Node<ResponseNodeData, "response">;

export type AppNode =
  | RequestInputNode
  | CropImageNode
  | TextNode
  | ResponseNode;
