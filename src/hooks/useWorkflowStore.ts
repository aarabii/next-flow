import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import { WorkflowState } from "@/types/store.type";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import {
  RequestInputField,
  CropImageNodeData,
  TextNodeData,
  ImageNodeData,
  VideoNodeData,
  AudioNodeData,
} from "@/types/node.type";

const initialNodes: Node[] = [
  {
    id: "request_inputs",
    type: "requestInput",
    position: { x: 50, y: 150 },
    data: {
      fields: [
        {
          id: "text_field",
          type: "text_field",
          label: "Text Field",
          value:
            "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
        },
        { id: "image_field", type: "image_field", label: "Image Field", value: "" },
      ] as RequestInputField[],
    },
    deletable: false,
  },
  {
    id: "response",
    type: "response",
    position: { x: 900, y: 250 },
    data: {
      results: [],
    },
    deletable: false,
  },
];

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  lastRunOutputs: {},
  lastRunPrompts: {},

  setNodes: (nodes) => {
    set({
      nodes: typeof nodes === "function" ? nodes(get().nodes) : nodes,
    });
  },

  setEdges: (edges) => {
    set({
      edges: typeof edges === "function" ? edges(get().edges) : edges,
    });
  },

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    const edgeId = `edge_${connection.source}_${
      connection.sourceHandle || "default"
    }_to_${connection.target}_${connection.targetHandle || "default"}`;
    
    const newEdge: Edge = {
      ...connection,
      id: edgeId,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    };

    set({
      edges: addEdge(newEdge, get().edges),
    });
  },

  onNodeDataChange: (nodeId: string, updatedData: Record<string, unknown>) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updatedData,
            },
          };
        }
        return node;
      }),
    });
  },

  addNode: (nodeType) => {
    const nodes = get().nodes;
    const id = `${nodeType}_${Date.now()}`;
    let data: Record<string, unknown> = {};

    if (nodeType === "cropImage") {
      data = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        inputImage: "",
        outputImage: "",
      } as CropImageNodeData;
    } else if (nodeType === "textNode") {
      data = {
        model: GEMINI_MODEL_CONFIG.textNode.defaultModelId,
        prompt: "",
        systemPrompt:
          "You are a helpful text generator assistant. Provide concise and accurate text responses.",
        imageInput: "",
        imageInputFileName: "",
        response: "",
        temperature: GEMINI_MODEL_CONFIG.textNode.defaultTemperature,
        topP: GEMINI_MODEL_CONFIG.textNode.defaultTopP,
        maxTokens: GEMINI_MODEL_CONFIG.textNode.defaultMaxTokens,
      } as TextNodeData;
    } else if (nodeType === "imageNode") {
      data = {
        model: GEMINI_MODEL_CONFIG.imageNode.defaultModelId,
        prompt: "",
        systemPrompt: "Describe a detailed visual scene based on the input.",
        imageInput: "",
        imageInputFileName: "",
        response: "",
        temperature: GEMINI_MODEL_CONFIG.imageNode.defaultTemperature,
        topP: GEMINI_MODEL_CONFIG.imageNode.defaultTopP,
        maxTokens: GEMINI_MODEL_CONFIG.imageNode.defaultMaxTokens,
        aspectRatio: "1:1",
      } as ImageNodeData;
    } else if (nodeType === "videoNode") {
      data = {
        model: GEMINI_MODEL_CONFIG.videoNode.defaultModelId,
        prompt: "",
        systemPrompt:
          "You are a video scene writer. Outline a continuous video description sequence based on the input.",
        imageInput: "",
        imageInputFileName: "",
        response: "",
        temperature: GEMINI_MODEL_CONFIG.videoNode.defaultTemperature,
        topP: GEMINI_MODEL_CONFIG.videoNode.defaultTopP,
        maxTokens: GEMINI_MODEL_CONFIG.videoNode.defaultMaxTokens,
      } as VideoNodeData;
    } else if (nodeType === "audioNode") {
      data = {
        model: GEMINI_MODEL_CONFIG.audioNode.defaultModelId,
        prompt: "",
        systemPrompt:
          "You are a speech narrator. Write standard speech-to-text narrations.",
        response: "",
        temperature: GEMINI_MODEL_CONFIG.audioNode.defaultTemperature,
        topP: GEMINI_MODEL_CONFIG.audioNode.defaultTopP,
        maxTokens: GEMINI_MODEL_CONFIG.audioNode.defaultMaxTokens,
      } as AudioNodeData;
    }

    const newNode: Node = {
      id,
      type: nodeType,
      position: { x: 480, y: 150 + nodes.length * 40 },
      data,
    };

    set({
      nodes: [...nodes, newNode],
    });
  },

  deleteEdge: (edgeId: string) => {
    set({
      edges: get().edges.filter((e) => e.id !== edgeId),
    });
  },

  deleteNode: (nodeId: string) => {
    if (nodeId === "request_inputs" || nodeId === "response") return;
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
  },

  resetStore: () => {
    set({
      nodes: initialNodes,
      edges: [],
      lastRunOutputs: {},
      lastRunPrompts: {},
    });
  },

  initializeWorkflow: (nodes: Node[], edges: Edge[]) => {
    const currentNodes = get().nodes;
    if (currentNodes.length <= 2) {
      set({ nodes, edges });
      return;
    }
    const mergedNodes = nodes.map((incomingNode) => {
      const localNode = currentNodes.find((n) => n.id === incomingNode.id);
      if (!localNode) return incomingNode;
      
      const incomingData = incomingNode.data as Record<string, unknown>;
      const localData = localNode.data as Record<string, unknown>;

      return {
        ...localNode,
        data: {
          ...localData,
          response: incomingData.response,
          outputImage: incomingData.outputImage,
          results: incomingData.results,
        },
      };
    });
    set({
      nodes: mergedNodes,
      edges,
    });
  },

  setLastRunOutputs: (outputs) => set({ lastRunOutputs: outputs }),
  setLastRunPrompts: (prompts) => set({ lastRunPrompts: prompts }),
}));
