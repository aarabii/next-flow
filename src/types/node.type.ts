import type { Node } from "@xyflow/react";

export interface RequestInputField {
  id: string;
  type: "text_field" | "image_field" | "video_field" | "audio_field";
  label: string;
  value: string;
  fileName?: string;
}

export interface BaseWorkflowNodeData<T = Record<string, unknown>> {
  connectedInputs?: string[];
  onChange?: (id: string, updatedData: Partial<T>) => void;
  onRunNode?: () => void;
  running?: boolean;
  onDeleteNode?: () => void;
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
  prompt?: string;
  systemPrompt?: string;
  imageInput?: string;
  imageInputFileName?: string;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  fields?: RequestInputField[];
}

export interface ImageNodeData extends BaseWorkflowNodeData<ImageNodeData> {
  prompt?: string;
  systemPrompt?: string;
  imageInput?: string;
  imageInputFileName?: string;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  fields?: RequestInputField[];
}

export interface VideoNodeData extends BaseWorkflowNodeData<VideoNodeData> {
  prompt?: string;
  systemPrompt?: string;
  imageInput?: string;
  imageInputFileName?: string;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  fields?: RequestInputField[];
}

export interface AudioNodeData extends BaseWorkflowNodeData<AudioNodeData> {
  prompt?: string;
  systemPrompt?: string;
  response?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  fields?: RequestInputField[];
}

export interface ResponseResultItem {
  nodeId: string;
  edgeId: string;
  sourceHandleId?: string | null;
  label: string;
  value?: string;
  type?: "image" | "video" | "audio" | "text";
}

export interface ResponseNodeData extends BaseWorkflowNodeData<ResponseNodeData> {
  results?: ResponseResultItem[];
  onDeleteConnection?: (edgeId: string) => void;
}

export type CustomNodeData =
  | RequestInputNodeData
  | CropImageNodeData
  | TextNodeData
  | ImageNodeData
  | VideoNodeData
  | AudioNodeData
  | ResponseNodeData;

export type RequestInputNode = Node<RequestInputNodeData, "requestInput">;
export type CropImageNode = Node<CropImageNodeData, "cropImage">;
export type TextNode = Node<TextNodeData, "textNode">;
export type ImageNode = Node<ImageNodeData, "imageNode">;
export type VideoNode = Node<VideoNodeData, "videoNode">;
export type AudioNode = Node<AudioNodeData, "audioNode">;
export type ResponseNode = Node<ResponseNodeData, "response">;

export type AppNode =
  | RequestInputNode
  | CropImageNode
  | TextNode
  | ImageNode
  | VideoNode
  | AudioNode
  | ResponseNode;
