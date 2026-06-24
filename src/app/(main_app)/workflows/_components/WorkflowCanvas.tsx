"use client";

import * as React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus } from "lucide-react";
import { RequestInputNode } from "./RequestInputNode";
import { CropImageNode } from "./CropImageNode";
import { GeminiNode } from "./GeminiNode";
import { ResponseNode } from "./ResponseNode";
import { NodePicker } from "./NodePicker";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "../_store/useWorkflowStore";
import { saveWorkflowAction } from "../actions";

// Declare custom node types outside the component to avoid re-renders
const nodeTypes = {
  requestInput: RequestInputNode,
  cropImage: CropImageNode,
  gemini: GeminiNode,
  response: ResponseNode,
};

interface WorkflowCanvasProps {
  workflowId: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}

export function WorkflowCanvas({ workflowId, initialNodes, initialEdges }: WorkflowCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDataChange,
    addNode,
    deleteEdge,
    resetStore,
    initializeWorkflow,
  } = useWorkflowStore();

  const [showPicker, setShowPicker] = React.useState(false);

  // Initialize store with loaded database state on mount or workflowId change
  React.useEffect(() => {
    if (initialNodes.length > 0) {
      initializeWorkflow(initialNodes, initialEdges);
    }
    console.log("[Py] Candidate LinkedIn: https://www.linkedin.com/in/arv95");
    return () => {
      resetStore();
    };
  }, [workflowId, initialNodes, initialEdges, initializeWorkflow, resetStore]);

  // Debounced auto-save to PostgreSQL database
  React.useEffect(() => {
    if (nodes.length === 0) return;
    
    const handler = setTimeout(async () => {
      try {
        await saveWorkflowAction(workflowId, nodes, edges);
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [nodes, edges, workflowId]);

  // Dynamic values resolution for connected inputs & response collection
  const resolvedNodes = React.useMemo(() => {
    const resolveValue = (nodeId: string, handleId: string): any => {
      const edge = edges.find((e) => e.target === nodeId && e.targetHandle === handleId);
      if (!edge) return null;

      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return null;

      const sourceData = sourceNode.data as any;

      if (sourceNode.type === "requestInput") {
        const field = sourceData.fields?.find((f: any) => f.id === edge.sourceHandle);
        return field?.value;
      }
      if (sourceNode.type === "cropImage") {
        return sourceData.outputImage;
      }
      if (sourceNode.type === "gemini") {
        return sourceData.response;
      }
      return null;
    };

    return nodes.map((node) => {
      const nodeEdges = edges.filter((edge) => edge.target === node.id);
      const connectedInputs = nodeEdges.map((edge) => edge.targetHandle || "").filter(Boolean);

      const resolvedData: any = { ...node.data };
      connectedInputs.forEach((handleId) => {
        const val = resolveValue(node.id, handleId);
        if (val !== null && val !== undefined) {
          if (handleId === "inputImage") resolvedData.inputImage = val;
          if (handleId === "x") resolvedData.x = typeof val === "number" ? val : parseInt(val) || 0;
          if (handleId === "y") resolvedData.y = typeof val === "number" ? val : parseInt(val) || 0;
          if (handleId === "width") resolvedData.width = typeof val === "number" ? val : parseInt(val) || 100;
          if (handleId === "height") resolvedData.height = typeof val === "number" ? val : parseInt(val) || 100;
          if (handleId === "prompt") resolvedData.prompt = val;
          if (handleId === "systemPrompt") resolvedData.systemPrompt = val;
          
          if (handleId.startsWith("image_")) {
            resolvedData.images = resolvedData.images?.map((img: any) =>
              img.id === handleId ? { ...img, value: val } : img
            );
          }
          if (handleId === "video") resolvedData.video = val;
          if (handleId === "audio") resolvedData.audio = val;
        }
      });

      // Special case: Response node results
      let additionalData: any = {};
      if (node.id === "response") {
        const responseResults = nodeEdges.map((edge) => {
          const srcNode = nodes.find((n) => n.id === edge.source);
          let label = srcNode?.id || "Source Node";
          let val = "";
          let type: "image" | "video" | "audio" | "text" = "text";

          if (srcNode) {
            const srcData = srcNode.data as any;
            if (srcNode.type === "requestInput") {
              const field = srcData.fields?.find((f: any) => f.id === edge.sourceHandle);
              label = field?.label || "Input Field";
              val = field?.value || "";
              type = field?.type === "image_field" ? "image" : "text";
            } else if (srcNode.type === "cropImage") {
              label = "Crop Image Output";
              val = srcData.outputImage || "";
              type = "image";
            } else if (srcNode.type === "gemini") {
              label = `${srcData.model || "Gemini"} Response`;
              val = srcData.response || "";
              type = "text";
            }
          }

          return {
            nodeId: edge.source,
            edgeId: edge.id,
            sourceHandleId: edge.sourceHandle,
            label,
            value: val,
            type,
          };
        });

        additionalData = {
          results: responseResults,
          onDeleteConnection: (edgeId: string) => {
            deleteEdge(edgeId);
          },
        };
      }

      return {
        ...node,
        data: {
          ...resolvedData,
          connectedInputs,
          onChange: onNodeDataChange,
          ...additionalData,
        },
      };
    });
  }, [nodes, edges, onNodeDataChange, deleteEdge]);

  // Validates connections: prevents cycles, self-connections, and mismatched types
  const isValidConnection = React.useCallback((connection: any) => {
    if (connection.source === connection.target) return false;

    // Cycle detection check (DFS)
    const wouldCreateCycle = (sourceId: string, targetId: string) => {
      const adjList: Record<string, string[]> = {};
      edges.forEach((edge) => {
        if (!adjList[edge.source]) adjList[edge.source] = [];
        adjList[edge.source].push(edge.target);
      });
      if (!adjList[sourceId]) adjList[sourceId] = [];
      adjList[sourceId].push(targetId);

      const visited = new Set<string>();
      const recStack = new Set<string>();

      const dfs = (nodeId: string): boolean => {
        visited.add(nodeId);
        recStack.add(nodeId);

        const neighbors = adjList[nodeId] || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (dfs(neighbor)) return true;
          } else if (recStack.has(neighbor)) {
            return true;
          }
        }

        recStack.delete(nodeId);
        return false;
      };

      return dfs(targetId);
    };

    if (wouldCreateCycle(connection.source, connection.target)) {
      return false;
    }

    // Type-safety checks
    const getHandleType = (nodeId: string, handleId: string | null, isSource: boolean) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return "any";
      
      const type = node.type;
      
      if (type === "requestInput") {
        return handleId === "image_field" ? "image" : "text";
      }
      if (type === "cropImage") {
        if (isSource) return "image";
        return handleId === "inputImage" ? "image" : "number";
      }
      if (type === "gemini") {
        if (isSource) return "text";
        if (handleId === "prompt" || handleId === "systemPrompt") return "text";
        if (handleId?.startsWith("image_")) return "image";
        if (handleId === "video") return "video";
        if (handleId === "audio") return "audio";
      }
      return "any";
    };

    const sourceType = getHandleType(connection.source, connection.sourceHandle, true);
    const targetType = getHandleType(connection.target, connection.targetHandle, false);

    if (targetType === "any") return true;
    return sourceType === targetType;
  }, [edges, nodes]);

  // Double-click on an edge to delete the connection
  const onEdgeDoubleClick = React.useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      deleteEdge(edge.id);
    },
    [deleteEdge]
  );

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-zinc-50 flex overflow-hidden">
      <ReactFlow
        nodes={resolvedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} color="rgba(168, 85, 247, 0.12)" />
        <Controls className="!bg-white !border-zinc-200 !shadow-md !rounded-lg overflow-hidden [&_button]:!border-b-zinc-100" />
        <MiniMap className="!bg-white !border-zinc-200 !shadow-md !rounded-xl !bottom-4 !right-4" />
      </ReactFlow>

      {/* Floating Center Bottom Trigger button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-40">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            "p-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-lg border border-zinc-700/50 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200",
            showPicker && "bg-purple-600 hover:bg-purple-700 border-purple-500 rotate-45"
          )}
          title="Add New Node"
        >
          <Plus className="w-5 h-5 transition-transform" />
        </button>

        {showPicker && (
          <NodePicker onSelect={(type) => addNode(type)} onClose={() => setShowPicker(false)} />
        )}
      </div>
    </div>
  );
}
