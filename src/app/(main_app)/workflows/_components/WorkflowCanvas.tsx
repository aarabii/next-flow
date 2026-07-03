"use client";

import * as React from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type Connection,
  ControlButton,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus,
  Clock,
  Play,
  LayoutGrid,
  Undo,
  Redo,
  Download,
  ArrowLeft,
} from "lucide-react";
import { SYSTEM_WORKFLOW_IDS } from "@/config/systemWorkflows";
import { CopyWorkflowButton } from "./CopyWorkflowButton";
import DotField from "@/components/DotField";
import { RequestInputNode } from "./RequestInputNode";
import { CropImageNode } from "./CropImageNode";
import { TextNode } from "./TextNode";
import { ResponseNode } from "./ResponseNode";
import { NodePicker } from "./NodePicker";
import { HistoryPanel } from "./HistoryPanel";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { RequestInputField, ResponseResultItem } from "@/types/node.type";
import { GEMINI_MODEL_CONFIG } from "@/config/modelConfig";
import { useRouter } from "next/navigation";

interface RunStatusResponse {
  status: string;
  nodeRuns: {
    nodeId: string;
    status: string;
  }[];
}

const nodeTypes = {
  requestInput: RequestInputNode,
  cropImage: CropImageNode,
  textNode: TextNode,
  response: ResponseNode,
};

interface WorkflowCanvasProps {
  workflowId: string;
  workflowName: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}

export function WorkflowCanvas({
  workflowId,
  workflowName,
  initialNodes,
  initialEdges,
}: WorkflowCanvasProps) {
  const router = useRouter();
  const isSystem = SYSTEM_WORKFLOW_IDS.some((sysId) =>
    workflowId.endsWith(sysId),
  );

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDataChange,
    addNode,
    deleteEdge,
    deleteNode,
    resetStore,
    initializeWorkflow,
    setNodes,
    setEdges,
    past,
    future,
    takeSnapshot,
    undo,
    redo,
  } = useWorkflowStore();

  const [showPicker, setShowPicker] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [activeRunId, setActiveRunId] = React.useState<string | null>(null);
  const [runningNodeIds, setRunningNodeIds] = React.useState<string[]>([]);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [localName, setLocalName] = React.useState(workflowName);
  const [prevWorkflowName, setPrevWorkflowName] = React.useState(workflowName);

  if (workflowName !== prevWorkflowName) {
    setPrevWorkflowName(workflowName);
    setLocalName(workflowName);
  }

  const [reactFlowInstance, setReactFlowInstance] =
    React.useState<ReactFlowInstance | null>(null);

  const autoLayout = React.useCallback(() => {
    takeSnapshot();

    const incoming = new Map<string, string[]>();
    nodes.forEach((n) => incoming.set(n.id, []));
    edges.forEach((e) => {
      if (incoming.has(e.target)) {
        incoming.get(e.target)!.push(e.source);
      }
    });

    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const getLevel = (nodeId: string): number => {
      if (levels.has(nodeId)) return levels.get(nodeId)!;
      if (visited.has(nodeId)) {
        return 0;
      }
      visited.add(nodeId);
      const parents = incoming.get(nodeId) || [];
      if (parents.length === 0) {
        visited.delete(nodeId);
        levels.set(nodeId, 0);
        return 0;
      }
      const parentLevels = parents.map((p) => getLevel(p));
      const lvl = Math.max(...parentLevels) + 1;
      visited.delete(nodeId);
      levels.set(nodeId, lvl);
      return lvl;
    };

    nodes.forEach((n) => getLevel(n.id));

    const groups = new Map<number, string[]>();
    nodes.forEach((n) => {
      const lvl = levels.get(n.id) || 0;
      if (!groups.has(lvl)) groups.set(lvl, []);
      groups.get(lvl)!.push(n.id);
    });

    const getEstimatedNodeHeight = (nId: string): number => {
      const node = nodes.find((n) => n.id === nId);
      if (!node) return 200;
      if (node.type === "textNode") return 480;
      if (node.type === "cropImage") return 350;
      if (node.type === "requestInput") {
        const fieldsCount = ((node.data?.fields || []) as unknown[]).length;
        return 150 + fieldsCount * 60;
      }
      if (node.type === "response") {
        const resultsCount = ((node.data?.results || []) as unknown[]).length;
        return 150 + Math.max(1, resultsCount) * 50;
      }
      return 200;
    };

    const colWidth = 380;
    const startX = 100;
    const centerY = 300;

    const levelHeights = new Map<number, number>();
    const levelOffsets = new Map<number, number[]>();

    groups.forEach((nodeIds, lvl) => {
      let totalHeight = 0;
      const offsets: number[] = [];

      nodeIds.forEach((nId) => {
        offsets.push(totalHeight);
        totalHeight += getEstimatedNodeHeight(nId) + 40;
      });

      levelHeights.set(lvl, totalHeight - 40);
      levelOffsets.set(lvl, offsets);
    });

    const newNodes = nodes.map((node) => {
      const lvl = levels.get(node.id) || 0;
      const nodeIds = groups.get(lvl) || [];
      const rowIndex = nodeIds.indexOf(node.id);

      const colHeight = levelHeights.get(lvl) || 0;
      const colOffsets = levelOffsets.get(lvl) || [];
      const yOffset = colOffsets[rowIndex] || 0;

      const x = startX + lvl * colWidth;
      const y = centerY - colHeight / 2 + yOffset;

      return {
        ...node,
        position: { x, y },
      };
    });

    setNodes(newNodes);

    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.15, duration: 800 });
      }
    }, 100);
  }, [nodes, edges, setNodes, reactFlowInstance, takeSnapshot]);

  const handleRename = async () => {
    if (!localName.trim() || localName.trim() === workflowName) {
      setIsEditingName(false);
      setLocalName(workflowName);
      return;
    }
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: localName.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to rename workflow");
      }

      setIsEditingName(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Failed to rename workflow: ${message}`);
      setLocalName(workflowName);
      setIsEditingName(false);
    }
  };

  const handleRunWorkflow = React.useCallback(
    async (scope: "FULL" | "PARTIAL" | "SINGLE", targetNodeIds?: string[]) => {
      try {
        const saveRes = await fetch(`/api/workflows/${workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        });

        if (!saveRes.ok) {
          throw new Error("Failed to auto-save canvas before execution");
        }

        const runRes = await fetch(`/api/workflows/${workflowId}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope, targetNodeIds }),
        });

        if (!runRes.ok) {
          throw new Error("Failed to trigger execution");
        }

        const res = await runRes.json();
        if (res.success) {
          setActiveRunId(res.runId);
          setHistoryOpen(true);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        alert(`Failed to trigger execution: ${message}`);
      }
    },
    [workflowId, nodes, edges, setActiveRunId, setHistoryOpen],
  );

  React.useEffect(() => {
    if (!activeRunId) return;

    let active = true;
    let timerId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/runs/${activeRunId}/status`);
        if (!res.ok) {
          throw new Error("Failed to fetch run status");
        }
        const data = await res.json();

        let updatedNodes: Node[] | null = null;
        let updatedEdges: Edge[] | null = null;
        const workflowRes = await fetch(`/api/workflows/${workflowId}`);
        if (workflowRes.ok) {
          const updated = await workflowRes.json();
          if (updated && updated.nodes) {
            updatedNodes = updated.nodes as Node[];
            updatedEdges = updated.edges as Edge[];
          }
        }

        if (!active) return;

        if (data) {
          const statusData = data as RunStatusResponse;
          const running = statusData.nodeRuns
            .filter((nr) => nr.status === "RUNNING")
            .map((nr) => nr.nodeId);
          setRunningNodeIds(running);

          if (updatedNodes && updatedEdges) {
            initializeWorkflow(updatedNodes, updatedEdges);
          }

          if (data.status === "RUNNING" || data.status === "PENDING") {
            timerId = setTimeout(pollStatus, 1200);
          } else {
            setActiveRunId(null);
            setRunningNodeIds([]);
          }
        }
      } catch (err) {
        console.error("Error polling run status:", err);
        if (active) {
          timerId = setTimeout(pollStatus, 3000);
        }
      }
    };

    pollStatus();

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, [activeRunId, workflowId, initializeWorkflow]);

  React.useEffect(() => {
    if (initialNodes.length > 0) {
      initializeWorkflow(initialNodes, initialEdges);
    }
    return () => {
      resetStore();
    };
  }, [workflowId, initialNodes, initialEdges, initializeWorkflow, resetStore]);

  React.useEffect(() => {
    const handleCanvasClick = (event: MouseEvent) => {
      if (isSystem) return;
      const target = event.target as HTMLElement;
      if (target && target.classList.contains("react-flow__handle")) {
        const nodeId = target.getAttribute("data-nodeid");
        const handleId = target.getAttribute("data-handleid") || null;

        const isSource =
          target.classList.contains("react-flow__handle-source") ||
          target.classList.contains("source");
        const isTarget =
          target.classList.contains("react-flow__handle-target") ||
          target.classList.contains("target");

        if (nodeId) {
          const edgesToDelete = edges.filter((edge: Edge) => {
            if (isSource) {
              return (
                edge.source === nodeId &&
                (edge.sourceHandle === handleId ||
                  (!edge.sourceHandle && !handleId))
              );
            } else if (isTarget) {
              return (
                edge.target === nodeId &&
                (edge.targetHandle === handleId ||
                  (!edge.targetHandle && !handleId))
              );
            }
            return false;
          });

          edgesToDelete.forEach((edge: Edge) => {
            deleteEdge(edge.id);
          });
        }
      }
    };

    document.addEventListener("click", handleCanvasClick);
    return () => {
      document.removeEventListener("click", handleCanvasClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, deleteEdge]);

  const saveWorkflow = React.useCallback(async () => {
    const { nodes: currentNodes, edges: currentEdges } =
      useWorkflowStore.getState();
    if (currentNodes.length === 0) return;
    if (activeRunId !== null) return;
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nodes: currentNodes, edges: currentEdges }),
      });
    } catch (error) {
      console.error("Auto-save error:", error);
    }
  }, [workflowId, activeRunId]);

  React.useEffect(() => {
    if (nodes.length === 0) return;
    if (activeRunId !== null) return;

    // Do not auto-save on change if user is actively typing in an input or textarea
    const activeEl = document.activeElement;
    const isTyping =
      activeEl &&
      (activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement).isContentEditable);

    if (isTyping) return;

    const handler = setTimeout(async () => {
      try {
        await fetch(`/api/workflows/${workflowId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nodes, edges }),
        });
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [nodes, edges, workflowId, activeRunId]);

  React.useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        takeSnapshot();
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        saveWorkflow();
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [takeSnapshot, saveWorkflow]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSystem) return;
      if (e.key === "Backspace" || e.key === "Delete") {
        const target = e.target;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          (target instanceof HTMLElement && target.isContentEditable)
        ) {
          return;
        }

        const selectedNodes = nodes.filter((n) => n.selected);
        const selectedEdges = edges.filter((e) => e.selected);

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          e.preventDefault();
          takeSnapshot();

          const deletableNodes = selectedNodes.filter(
            (n) => n.id !== "request_inputs" && n.id !== "response",
          );
          const deletableNodeIds = deletableNodes.map((n) => n.id);
          const selectedEdgeIds = selectedEdges.map((e) => e.id);

          if (deletableNodeIds.length > 0 || selectedEdgeIds.length > 0) {
            setNodes((nds: Node[]) =>
              nds.filter((n) => !deletableNodeIds.includes(n.id)),
            );
            setEdges((eds: Edge[]) =>
              eds.filter(
                (edge: Edge) =>
                  !deletableNodeIds.includes(edge.source) &&
                  !deletableNodeIds.includes(edge.target) &&
                  !selectedEdgeIds.includes(edge.id),
              ),
            );
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nodes, edges, setNodes, setEdges, takeSnapshot, isSystem]);

  const resolvedNodes = React.useMemo(() => {
    const resolveValue = (nodeId: string, handleId: string): string | null => {
      const edge = edges.find(
        (e: Edge) => e.target === nodeId && e.targetHandle === handleId,
      );
      if (!edge) return null;

      const sourceNode = nodes.find((n: Node) => n.id === edge.source);
      if (!sourceNode) return null;

      const sourceData = sourceNode.data as Record<string, unknown>;

      if (sourceNode.type === "requestInput") {
        const fields = sourceData.fields as RequestInputField[] | undefined;
        const field = fields?.find(
          (f: RequestInputField) => f.id === edge.sourceHandle,
        );
        return field?.value ?? null;
      }
      if (sourceNode.type === "cropImage") {
        return (sourceData.outputImage as string) ?? null;
      }
      if (sourceNode.type === "gemini" || sourceNode.type === "textNode") {
        return (sourceData.response as string) ?? null;
      }
      return null;
    };

    return nodes.map((node: Node) => {
      const nodeEdges = edges.filter((edge: Edge) => edge.target === node.id);
      const connectedInputs = nodeEdges
        .map((edge: Edge) => edge.targetHandle || "")
        .filter(Boolean);

      const resolvedData: Record<string, unknown> = { ...node.data };
      connectedInputs.forEach((handleId: string) => {
        const val = resolveValue(node.id, handleId);
        if (val !== null && val !== undefined) {
          if (handleId === "inputImage") resolvedData.inputImage = val;
          if (handleId === "x")
            resolvedData.x = typeof val === "number" ? val : parseInt(val) || 0;
          if (handleId === "y")
            resolvedData.y = typeof val === "number" ? val : parseInt(val) || 0;
          if (handleId === "width")
            resolvedData.width =
              typeof val === "number" ? val : parseInt(val) || 100;
          if (handleId === "height")
            resolvedData.height =
              typeof val === "number" ? val : parseInt(val) || 100;
          if (handleId === "prompt") resolvedData.prompt = val;
          if (handleId === "systemPrompt") resolvedData.systemPrompt = val;

          const fields = resolvedData.fields as RequestInputField[] | undefined;
          if (fields) {
            resolvedData.fields = fields.map((f) =>
              f.id === handleId ? { ...f, value: val } : f,
            );
          }
          if (handleId === "image_input") resolvedData.imageInput = val;
          if (handleId === "video") resolvedData.video = val;
          if (handleId === "audio") resolvedData.audio = val;
        }
      });

      let additionalData: Record<string, unknown> = {};
      if (node.id === "response") {
        const responseResults = nodeEdges.map((edge: Edge) => {
          const srcNode = nodes.find((n: Node) => n.id === edge.source);
          let label = srcNode?.id || "Source Node";
          let val = "";
          let type: "image" | "video" | "audio" | "text" = "text";

          if (srcNode) {
            const srcData = srcNode.data as Record<string, unknown>;
            if (srcNode.type === "requestInput") {
              const fields = srcData.fields as RequestInputField[] | undefined;
              const field = fields?.find(
                (f: RequestInputField) => f.id === edge.sourceHandle,
              );
              label = field?.label || "Input Field";
              val = field?.value || "";
              type =
                field?.type === "image_field"
                  ? "image"
                  : field?.type === "audio_field"
                    ? "audio"
                    : "text";

              const fileName = field?.fileName;
              const fileSize = field?.fileSize;

              return {
                nodeId: edge.source,
                edgeId: edge.id,
                sourceHandleId: edge.sourceHandle,
                label,
                value: val,
                type,
                fileName,
                fileSize,
              } as ResponseResultItem;
            } else if (srcNode.type === "cropImage") {
              label = "Crop Image Output";
              val = (srcData.outputImage as string) || "";
              type = "image";
            } else if (srcNode.type === "textNode") {
              label = "Text Output";
              val = (srcData.response as string) || "";
              type = "text";
            } else if (srcNode.type === "gemini") {
              label = `${(srcData.model as string) || "Gemini"} Response`;
              val = (srcData.response as string) || "";
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
          } as ResponseResultItem;
        });

        additionalData = {
          results: responseResults,
          onDeleteConnection: isSystem
            ? undefined
            : (edgeId: string) => {
                deleteEdge(edgeId);
              },
        };
      }

      return {
        ...node,
        draggable: resolvedData.isPositionLocked ? false : undefined,
        data: {
          ...resolvedData,
          isSystem,
          connectedInputs,
          onChange: onNodeDataChange,
          onRunNode: () => handleRunWorkflow("SINGLE", [node.id]),
          running: runningNodeIds.includes(node.id),
          onDeleteNode: isSystem ? undefined : () => deleteNode(node.id),
          ...additionalData,
        },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nodes,
    edges,
    onNodeDataChange,
    deleteEdge,
    deleteNode,
    runningNodeIds,
    handleRunWorkflow,
  ]);

  const isValidConnection = React.useCallback(
    (connection: Connection | Edge) => {
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;

      const wouldCreateCycle = (sourceId: string, targetId: string) => {
        const adjList: Record<string, string[]> = {};
        edges.forEach((edge: Edge) => {
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

      const getHandleType = (
        nodeId: string,
        handleId: string | null,
        isSource: boolean,
      ) => {
        const node = nodes.find((n: Node) => n.id === nodeId);
        if (!node) return "any";

        const type = node.type;

        if (type === "requestInput") {
          if (handleId?.startsWith("image_field")) return "image";
          if (handleId?.startsWith("audio_field")) return "audio";
          return "text";
        }
        if (type === "cropImage") {
          if (isSource) return "image";
          return handleId === "inputImage" ? "image" : "number";
        }
        if (type === "textNode") {
          if (isSource) return "text";
          if (handleId === "prompt" || handleId === "systemPrompt")
            return "text";
          if (handleId?.startsWith("text_field")) return "text";
          if (handleId?.startsWith("image_field")) return "image";
          if (handleId?.startsWith("audio_field")) return "audio";
          if (handleId === "image_input") return "image";
        }

        if (type === "gemini") {
          if (isSource) return "text";
          if (handleId === "prompt" || handleId === "systemPrompt")
            return "text";
          if (handleId?.startsWith("image_")) return "image";
          if (handleId === "video") return "video";
          if (handleId === "audio") return "audio";
        }
        return "any";
      };

      const sourceType = getHandleType(
        connection.source,
        connection.sourceHandle ?? null,
        true,
      );
      const targetType = getHandleType(
        connection.target,
        connection.targetHandle ?? null,
        false,
      );

      if (targetType === "any" || sourceType === "any") return true;
      return sourceType === targetType;
    },
    [edges, nodes],
  );

  const onEdgeDoubleClick = React.useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (isSystem) return;
      deleteEdge(edge.id);
    },
    [deleteEdge, isSystem],
  );

  const handleExportJSON = React.useCallback(() => {
    const cleanNodes = nodes.map((node: Node) => {
      const { ...restData } = node.data as Record<string, unknown>;

      const dataCopy = { ...restData };

      if (node.type === "textNode") {
        const config = GEMINI_MODEL_CONFIG.textNode;
        dataCopy.model = dataCopy.model || config.defaultModelId;
        dataCopy.temperature =
          dataCopy.temperature !== undefined
            ? Number(dataCopy.temperature)
            : config.defaultTemperature;
        dataCopy.topP =
          dataCopy.topP !== undefined
            ? Number(dataCopy.topP)
            : config.defaultTopP;
        dataCopy.maxTokens =
          dataCopy.maxTokens !== undefined
            ? Number(dataCopy.maxTokens)
            : config.defaultMaxTokens;
        dataCopy.systemPrompt =
          dataCopy.systemPrompt !== undefined
            ? dataCopy.systemPrompt
            : "You are a helpful text generator assistant. Provide concise and accurate text responses.";

        // Strip transient runtime output states
        delete dataCopy.response;
        delete dataCopy.imageInput;
        delete dataCopy.imageInputFileName;
      } else if (node.type === "cropImage") {
        dataCopy.x = dataCopy.x !== undefined ? Number(dataCopy.x) : 0;
        dataCopy.y = dataCopy.y !== undefined ? Number(dataCopy.y) : 0;
        dataCopy.width =
          dataCopy.width !== undefined ? Number(dataCopy.width) : 100;
        dataCopy.height =
          dataCopy.height !== undefined ? Number(dataCopy.height) : 100;

        // Strip transient runtime output states
        dataCopy.inputImage = "";
        dataCopy.outputImage = "";
      } else if (node.type === "response") {
        // Strip transient response output states
        dataCopy.results = [];
      } else if (node.type === "requestInput") {
        // Clear user input values
        if (Array.isArray(dataCopy.fields)) {
          dataCopy.fields = (dataCopy.fields as RequestInputField[]).map(
            (f) => ({
              ...f,
              value: "",
            }),
          );
        }
      }

      return {
        ...node,
        data: dataCopy,
      };
    });

    const dataStr = JSON.stringify({ nodes: cleanNodes, edges }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflowName.toLowerCase().replace(/\s+/g, "-")}-workflow.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, workflowName]);

  return (
    <div className="relative w-full h-full flex-1 bg-zinc-50 flex flex-col text-zinc-900 overflow-hidden">
      {/* Floating Header Navigation */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-2 flex-wrap sm:flex-nowrap">
        {/* Left side floating tabs */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Back Tab */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex items-center justify-center w-10 h-10 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 text-zinc-650 hover:text-purple-600 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Back to Dashboard</TooltipContent>
          </Tooltip>

          {/* Workflow Name Card */}
          <div className="flex items-center h-10 px-4 bg-white border border-zinc-200 rounded-xl shadow-md select-none font-secondary text-sm font-semibold text-zinc-800">
            {isEditingName ? (
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  } else if (e.key === "Escape") {
                    setIsEditingName(false);
                    setLocalName(workflowName);
                  }
                }}
                className="text-sm font-semibold text-zinc-800 px-1 py-0.5 border border-purple-500 rounded outline-hidden bg-white w-32 focus:ring-2 focus:ring-purple-500/20 font-secondary"
                autoFocus
              />
            ) : (
              <span
                onDoubleClick={() => !isSystem && setIsEditingName(true)}
                className={cn(
                  "select-none truncate max-w-37 sm:max-w-xs transition-colors",
                  isSystem
                    ? "cursor-default text-zinc-500"
                    : "cursor-pointer hover:text-purple-600",
                )}
                title={isSystem ? undefined : "Double click to rename"}
              >
                {localName}
              </span>
            )}
          </div>
        </div>

        {/* Right side actions tab */}
        <div className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-xl shadow-md pointer-events-auto shrink-0">
          {/* Export JSON Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleExportJSON}
                className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-655 hover:text-purple-600 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
              >
                <Download className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Export JSON</TooltipContent>
          </Tooltip>

          {/* Copy Workflow Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <CopyWorkflowButton
                  workflowName={workflowName}
                  nodes={nodes}
                  edges={edges}
                  variant="icon"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Copy Workflow</TooltipContent>
          </Tooltip>

          {/* Run Workflow Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => handleRunWorkflow("FULL")}
                disabled={activeRunId !== null}
                className={cn(
                  "p-2 rounded-lg text-zinc-655 hover:text-emerald-650 disabled:opacity-50 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center",
                  activeRunId !== null && "animate-pulse",
                )}
              >
                <Play
                  className={cn(
                    "w-4 h-4",
                    activeRunId === null
                      ? "fill-zinc-600 stroke-none hover:fill-emerald-600"
                      : "fill-emerald-600 stroke-none",
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {activeRunId !== null ? "Running..." : "Run Workflow"}
            </TooltipContent>
          </Tooltip>

          {/* History Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setHistoryOpen(!historyOpen)}
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center",
                  historyOpen
                    ? "bg-purple-50 text-purple-600 hover:bg-purple-100/50"
                    : "text-zinc-655 hover:text-purple-600",
                )}
              >
                <Clock className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Runs History</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 w-full relative overflow-hidden flex">
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={resolvedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeDoubleClick={onEdgeDoubleClick}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            onInit={setReactFlowInstance}
            fitView
            onNodeDragStart={takeSnapshot}
            onSelectionDragStart={takeSnapshot}
            nodesDraggable={true}
            nodesConnectable={!isSystem}
            edgesFocusable={!isSystem}
            deleteKeyCode={null}
            onPaneClick={() => setShowPicker(false)}
            onNodeClick={() => setShowPicker(false)}
          >
            <DotField />
            <Controls className="bg-white! border-zinc-200! shadow-md! rounded-lg! overflow-hidden [&_button]:border-b-zinc-100!">
              <ControlButton onClick={autoLayout} title="Auto Layout">
                <LayoutGrid className="w-3.5 h-3.5 text-zinc-600 hover:text-purple-600 transition-colors" />
              </ControlButton>
              <ControlButton
                onClick={undo}
                disabled={past.length === 0}
                title="Undo last action (Ctrl+Z)"
                className="disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Undo
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    past.length > 0
                      ? "text-zinc-600 hover:text-purple-600"
                      : "text-zinc-300",
                  )}
                />
              </ControlButton>
              <ControlButton
                onClick={redo}
                disabled={future.length === 0}
                title="Redo last action (Ctrl+Y)"
                className="disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Redo
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    future.length > 0
                      ? "text-zinc-600 hover:text-purple-600"
                      : "text-zinc-300",
                  )}
                />
              </ControlButton>
            </Controls>
            <MiniMap className="hidden sm:block bg-white! border-zinc-200! shadow-md! rounded-xl! bottom-4! right-4!" />
          </ReactFlow>

          {!isSystem && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center gap-4 z-40"
              onMouseLeave={() => setShowPicker(false)}
            >
              <button
                id="add-node-button"
                onClick={() => setShowPicker(!showPicker)}
                className={cn(
                  "p-3.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg border border-zinc-700/50 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shrink-0",
                  showPicker &&
                    "bg-purple-600 hover:bg-purple-700 border-purple-500 rotate-45",
                )}
                title="Add New Node"
              >
                <Plus className="w-5 h-5 transition-transform" />
              </button>

              {showPicker && (
                <NodePicker
                  onSelect={(type) => addNode(type)}
                  onClose={() => setShowPicker(false)}
                  className="static translate-x-0 bottom-auto left-auto animate-in fade-in slide-in-from-bottom-2 duration-150"
                />
              )}
            </div>
          )}
        </div>

        {historyOpen && (
          <HistoryPanel
            workflowId={workflowId}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
