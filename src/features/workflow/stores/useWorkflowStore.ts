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
import { WorkflowState } from "../types/store.type";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import {
  CropImageNodeData,
  TextNodeData,
} from "../types/node.type";
import { DEFAULT_INITIAL_NODES } from "@/config/defaults";

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: DEFAULT_INITIAL_NODES,
  edges: [],
  lastRunOutputs: {},
  lastRunPrompts: {},
  past: [],
  future: [],

  takeSnapshot: () => {
    const { nodes, edges, past } = get();
    const currentNodes = JSON.parse(JSON.stringify(nodes));
    const currentEdges = JSON.parse(JSON.stringify(edges));

    if (past.length > 0) {
      const lastSnapshot = past[past.length - 1];
      if (
        JSON.stringify(lastSnapshot.nodes) === JSON.stringify(currentNodes) &&
        JSON.stringify(lastSnapshot.edges) === JSON.stringify(currentEdges)
      ) {
        return;
      }
    }

    set({
      past: [...past, { nodes: currentNodes, edges: currentEdges }].slice(-50),
      future: [],
    });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    const currentNodes = JSON.parse(JSON.stringify(nodes));
    const currentEdges = JSON.parse(JSON.stringify(edges));

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: [{ nodes: currentNodes, edges: currentEdges }, ...future].slice(0, 50),
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    const currentNodes = JSON.parse(JSON.stringify(nodes));
    const currentEdges = JSON.parse(JSON.stringify(edges));

    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...past, { nodes: currentNodes, edges: currentEdges }].slice(-50),
      future: newFuture,
    });
  },

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
    const hasRemoval = changes.some((c) => c.type === "remove");
    if (hasRemoval) {
      get().takeSnapshot();
    }
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const hasRemoval = changes.some((c) => c.type === "remove");
    if (hasRemoval) {
      get().takeSnapshot();
    }
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    get().takeSnapshot();
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
    get().takeSnapshot();
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
    get().takeSnapshot();
    set({
      edges: get().edges.filter((e) => e.id !== edgeId),
    });
  },

  deleteNode: (nodeId: string) => {
    if (nodeId === "request_inputs" || nodeId === "response") return;
    get().takeSnapshot();
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
  },

  resetStore: () => {
    set({
      nodes: DEFAULT_INITIAL_NODES,
      edges: [],
      lastRunOutputs: {},
      lastRunPrompts: {},
      past: [],
      future: [],
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
