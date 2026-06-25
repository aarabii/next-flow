import { Node, Edge, NodeChange, EdgeChange, Connection } from "@xyflow/react";

export interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDataChange: (nodeId: string, updatedData: Record<string, unknown>) => void;
  addNode: (
    nodeType: "cropImage" | "textNode" | "imageNode" | "videoNode" | "audioNode"
  ) => void;
  deleteEdge: (edgeId: string) => void;
  deleteNode: (nodeId: string) => void;
  resetStore: () => void;
  initializeWorkflow: (nodes: Node[], edges: Edge[]) => void;
  lastRunOutputs: Record<string, unknown>;
  lastRunPrompts: Record<string, string>;
  setLastRunOutputs: (outputs: Record<string, unknown>) => void;
  setLastRunPrompts: (prompts: Record<string, string>) => void;
}

export interface DashboardState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  uploadingIds: Record<string, boolean>;
  setUploadingId: (id: string, uploading: boolean) => void;
}
