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

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDataChange: (nodeId: string, updatedData: any) => void;
  addNode: (nodeType: "cropImage" | "gemini") => void;
  deleteEdge: (edgeId: string) => void;
  resetStore: () => void;
  initializeWorkflow: (nodes: Node[], edges: Edge[]) => void;
}

const initialNodes: Node[] = [
  {
    id: "request_inputs",
    type: "requestInput",
    position: { x: 50, y: 150 },
    data: {
      fields: [
        { id: "text_field", type: "text_field", label: "Text Field", value: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design." },
        { id: "image_field", type: "image_field", label: "Image Field", value: "" }
      ]
    },
    deletable: false,
  },
  {
    id: "response",
    type: "response",
    position: { x: 900, y: 250 },
    data: {
      results: []
    },
    deletable: false,
  }
];

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: initialNodes,
  edges: [],
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
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    const edgeId = `edge_${connection.source}_${connection.sourceHandle || "default"}_to_${connection.target}_${connection.targetHandle || "default"}`;
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
  onNodeDataChange: (nodeId, updatedData) => {
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
    let data: any = {};

    if (nodeType === "cropImage") {
      data = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        inputImage: "",
        outputImage: "",
      };
    } else if (nodeType === "gemini") {
      data = {
        model: "Gemini 3.1 Pro",
        prompt: "",
        systemPrompt: "",
        systemPromptEnabled: true,
        images: [{ id: "image_0", value: "", fileName: "" }],
        video: "",
        audio: "",
        response: "",
        temperature: 1.0,
        topP: 0.95,
        maxTokens: 2048,
      };
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
  deleteEdge: (edgeId) => {
    set({
      edges: get().edges.filter((e) => e.id !== edgeId),
    });
  },
  resetStore: () => {
    set({
      nodes: initialNodes,
      edges: [],
    });
  },
  initializeWorkflow: (nodes, edges) => {
    set({
      nodes,
      edges,
    });
  },
}));
