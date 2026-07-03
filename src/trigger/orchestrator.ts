import { task, wait } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/prisma";
import { cropImageTask } from "./cropImage";
import { geminiTask } from "./gemini";
import {
  GEMINI_MODEL_CONFIG,
  type WorkflowNodeType,
} from "../config/modelConfig";
import { type Node, type Edge } from "@xyflow/react";
import { Prisma } from "../../generated/prisma/client";
import {
  RequestInputField,
  RequestInputNodeData,
  CropImageNodeData,
  TextNodeData,
  ResponseResultItem,
} from "@/types/node.type";

export interface OrchestratorPayload {
  workflowRunId: string;
}

interface ResolvedInputs {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  imageUrl?: string;
  prompt?: string;
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  topK?: number;
  reasoning?: string;
  model?: string;
  images: string[];
  video?: string;
  audio?: string;
  imageInput?: string;
  [key: string]: unknown;
}

type NodeExecutionState =
  | "PENDING"
  | "TRIGGERED"
  | "SUCCESS"
  | "FAILED"
  | "SKIPPED";

export const workflowOrchestratorTask = task({
  id: "workflow-orchestrator",
  run: async (payload: OrchestratorPayload) => {
    const { workflowRunId } = payload;
    const runStartTime = new Date();

    const workflowRun = await db.workflowRun.findUnique({
      where: { id: workflowRunId },
      include: { workflow: true },
    });

    if (!workflowRun) {
      throw new Error(`WorkflowRun ${workflowRunId} not found`);
    }

    await db.workflowRun.update({
      where: { id: workflowRunId },
      data: { startedAt: runStartTime },
    });

    const workflow = workflowRun.workflow;
    let nodes = workflow.nodes as unknown as Node[];
    const edges = workflow.edges as unknown as Edge[];

    const nodeRuns = await db.nodeRun.findMany({
      where: { workflowRunId },
    });

    const pendingNodeRuns = nodeRuns.filter((nr) => nr.status === "PENDING");
    const executionNodeIds = pendingNodeRuns.map((nr) => nr.nodeId);

    const nodeOutputs: { [nodeId: string]: unknown } = {};

    const nodeState: { [nodeId: string]: NodeExecutionState } = {};
    for (const nodeId of executionNodeIds) {
      nodeState[nodeId] = "PENDING";
    }

    const getUpstreamDependencies = (nodeId: string) => {
      return edges
        .filter((edge) => edge.target === nodeId)
        .map((edge) => edge.source);
    };

    const resolveInputs = async (nodeId: string, node: Node) => {
      const incomingEdges = edges.filter((edge) => edge.target === nodeId);
      const resolved: ResolvedInputs = { images: [] };

      if (node.type === "cropImage") {
        const data = node.data as CropImageNodeData;
        resolved.x = data.x !== undefined ? Number(data.x) : 0;
        resolved.y = data.y !== undefined ? Number(data.y) : 0;
        resolved.width = data.width !== undefined ? Number(data.width) : 100;
        resolved.height = data.height !== undefined ? Number(data.height) : 100;
        resolved.imageUrl = data.inputImage || "";
      } else if (node.type === "textNode") {
        const type = node.type as WorkflowNodeType;
        const config = GEMINI_MODEL_CONFIG[type];
        const data = node.data as TextNodeData;
        resolved.systemPrompt = data.systemPrompt || "";
        resolved.temperature =
          data.temperature !== undefined
            ? Number(data.temperature)
            : config.defaultTemperature;
        resolved.topP =
          data.topP !== undefined ? Number(data.topP) : config.defaultTopP;
        resolved.maxTokens =
          data.maxTokens !== undefined
            ? Number(data.maxTokens)
            : config.defaultMaxTokens;
        resolved.topK =
          data.topK !== undefined ? Number(data.topK) : 40;
        resolved.reasoning = data.reasoning || "Auto";
        resolved.model = data.model || config.defaultModelId;
        resolved.images = [];

        const fieldsList = data.fields
          ? (JSON.parse(JSON.stringify(data.fields)) as RequestInputField[])
          : [
              {
                id: "prompt",
                type: "text_field" as const,
                label: "Prompt",
                value: data.prompt || "",
              },
            ];
        if (!data.fields && data.imageInput) {
          fieldsList.push({
            id: "image_input",
            type: "image_field" as const,
            label: "Input Image",
            value: data.imageInput,
          });
        }
        resolved.fieldsList = fieldsList;
      }

      for (const edge of incomingEdges) {
        const sourceId = edge.source;
        const sourceHandle = edge.sourceHandle;
        const targetHandle = edge.targetHandle;

        let sourceVal = "";

        if (nodeOutputs[sourceId] !== undefined) {
          const out = nodeOutputs[sourceId];
          if (out && typeof out === "object") {
            const outObj = out as Record<string, unknown>;
            sourceVal =
              (outObj.url as string) || (outObj.response as string) || "";
          } else {
            sourceVal = String(out || "");
          }
        } else {
          const srcNode = nodes.find((n) => n.id === sourceId);
          if (srcNode) {
            if (srcNode.type === "requestInput") {
              const srcData = srcNode.data as RequestInputNodeData;
              const field = srcData.fields?.find((f) => f.id === sourceHandle);
              sourceVal = field?.value || "";
            } else if (srcNode.type === "cropImage") {
              const srcData = srcNode.data as CropImageNodeData;
              sourceVal = srcData.outputImage || "";
            } else if (srcNode.type === "textNode") {
              const srcData = srcNode.data as { response?: string };
              sourceVal = srcData.response || "";
            }
          }
        }

        if (node.type === "cropImage") {
          if (targetHandle === "inputImage") resolved.imageUrl = sourceVal;
          if (targetHandle === "x") resolved.x = Number(sourceVal);
          if (targetHandle === "y") resolved.y = Number(sourceVal);
          if (targetHandle === "width") resolved.width = Number(sourceVal);
          if (targetHandle === "height") resolved.height = Number(sourceVal);
        } else if (node.type === "textNode") {
          const fieldsList = resolved.fieldsList as
            | RequestInputField[]
            | undefined;
          if (fieldsList) {
            const field = fieldsList.find((f) => f.id === targetHandle);
            if (field) {
              field.value = sourceVal;
            }
          }
          if (targetHandle === "prompt") resolved.prompt = sourceVal;
          if (targetHandle === "system" || targetHandle === "systemPrompt")
            resolved.systemPrompt = sourceVal;
          if (targetHandle === "image_input") {
            resolved.imageInput = sourceVal;
            if (sourceVal) resolved.images.push(sourceVal);
          }
        }
      }

      if (node.type === "textNode") {
        const fieldsList = resolved.fieldsList as
          | RequestInputField[]
          | undefined;
        if (fieldsList) {
          const prompts: string[] = [];
          for (const field of fieldsList) {
            if (field.type === "text_field") {
              if (field.value) prompts.push(field.value);
            } else if (field.type === "image_field" || field.type === "audio_field") {
              if (field.value) resolved.images.push(field.value);
            }
          }
          if (prompts.length > 0) {
            resolved.prompt = prompts.join("\n\n");
          }
        }
      }

      return resolved;
    };

    const triggerNode = async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      const nodeRun = pendingNodeRuns.find((nr) => nr.nodeId === nodeId);

      if (!node || !nodeRun) return;

      const inputs = await resolveInputs(nodeId, node);

      await db.nodeRun.update({
        where: { id: nodeRun.id },
        data: {
          inputs: inputs as unknown as Prisma.InputJsonValue,
        },
      });

      if (node.type === "cropImage") {
        await cropImageTask.trigger({
          nodeRunId: nodeRun.id,
          imageUrl: inputs.imageUrl || "",
          x: inputs.x || 0,
          y: inputs.y || 0,
          width: inputs.width || 100,
          height: inputs.height || 100,
        });
      } else if (node.type === "textNode") {
        const defaultModelId = GEMINI_MODEL_CONFIG.textNode.defaultModelId;

        const nodeModel =
          (node.data as { model?: string }).model || defaultModelId;
        await geminiTask.trigger({
          nodeRunId: nodeRun.id,
          model: inputs.model || nodeModel,
          nodeType: node.type,
          prompt: inputs.prompt,
          systemPrompt: inputs.systemPrompt,
          images: inputs.images,
          temperature: inputs.temperature,
          topP: inputs.topP,
          maxTokens: inputs.maxTokens,
          topK: inputs.topK,
          reasoning: inputs.reasoning,
        });
      }
    };

    const processCompletedNode = (nodeId: string, output: unknown) => {
      nodeOutputs[nodeId] = output;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (node.type === "cropImage") {
        const outputObj = output as { url: string };
        nodes = nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...(n.data as Record<string, unknown>),
                  outputImage: outputObj.url,
                },
              }
            : n,
        );
      } else if (node.type === "textNode") {
        const outputObj = output as { response: string };
        nodes = nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...(n.data as Record<string, unknown>),
                  response: outputObj.response,
                },
              }
            : n,
        );
      }
    };

    try {
      const MAX_POLL_ITERATIONS = 300; // ~10 minutes at 2s intervals
      let pollIteration = 0;

      while (pollIteration++ < MAX_POLL_ITERATIONS) {
        const blockedNodes = executionNodeIds.filter((nodeId) => {
          if (nodeState[nodeId] !== "PENDING") return false;
          const deps = getUpstreamDependencies(nodeId);
          const executionDeps = deps.filter((depId) =>
            executionNodeIds.includes(depId),
          );
          return executionDeps.some(
            (depId) =>
              nodeState[depId] === "FAILED" || nodeState[depId] === "SKIPPED",
          );
        });

        for (const nodeId of blockedNodes) {
          nodeState[nodeId] = "SKIPPED";
          const nodeRun = pendingNodeRuns.find((nr) => nr.nodeId === nodeId);
          if (nodeRun) {
            await db.nodeRun.update({
              where: { id: nodeRun.id },
              data: { status: "SKIPPED", completedAt: new Date() },
            });
          }
        }

        const readyNodes = executionNodeIds.filter((nodeId) => {
          if (nodeState[nodeId] !== "PENDING") return false;
          const deps = getUpstreamDependencies(nodeId);

          const executionDeps = deps.filter((depId) =>
            executionNodeIds.includes(depId),
          );
          return executionDeps.every((depId) => nodeState[depId] === "SUCCESS");
        });

        for (const nodeId of readyNodes) {
          await triggerNode(nodeId);
          nodeState[nodeId] = "TRIGGERED";
        }

        const allDone = executionNodeIds.every(
          (nodeId) =>
            nodeState[nodeId] === "SUCCESS" ||
            nodeState[nodeId] === "FAILED" ||
            nodeState[nodeId] === "SKIPPED",
        );
        if (allDone) break;

        const hasInFlight = executionNodeIds.some(
          (nodeId) => nodeState[nodeId] === "TRIGGERED",
        );
        if (!hasInFlight && readyNodes.length === 0) {
          console.error(
            "Orchestrator deadlock detected — breaking execution loop",
          );
          break;
        }

        if (hasInFlight) {
          await wait.for({ seconds: 2 });

          const latestNodeRuns = await db.nodeRun.findMany({
            where: { workflowRunId },
          });

          let nodesUpdated = false;

          for (const nr of latestNodeRuns) {
            if (!executionNodeIds.includes(nr.nodeId)) continue;

            if (
              nr.status === "SUCCESS" &&
              nodeState[nr.nodeId] === "TRIGGERED"
            ) {
              processCompletedNode(nr.nodeId, nr.output);
              nodeState[nr.nodeId] = "SUCCESS";
              nodesUpdated = true;
            } else if (
              nr.status === "FAILED" &&
              nodeState[nr.nodeId] === "TRIGGERED"
            ) {
              nodeState[nr.nodeId] = "FAILED";
              nodesUpdated = true;
            }
          }

          if (nodesUpdated) {
            await db.workflow.update({
              where: { id: workflow.id },
              data: { nodes: nodes as unknown as Prisma.InputJsonValue },
            });
          }
        }
      }

      // If the loop exhausted iterations, mark remaining in-flight nodes as timed out
      if (pollIteration >= MAX_POLL_ITERATIONS) {
        console.error("Orchestrator timed out after max poll iterations");
        for (const nodeId of executionNodeIds) {
          if (nodeState[nodeId] === "TRIGGERED" || nodeState[nodeId] === "PENDING") {
            nodeState[nodeId] = "FAILED";
            const nodeRun = pendingNodeRuns.find((nr) => nr.nodeId === nodeId);
            if (nodeRun) {
              await db.nodeRun.update({
                where: { id: nodeRun.id },
                data: {
                  status: "FAILED",
                  error: "Execution timed out",
                  completedAt: new Date(),
                },
              });
            }
          }
        }
      }

      const responseNode = nodes.find((n) => n.type === "response");
      if (responseNode) {
        const incomingToResponse = edges.filter(
          (edge) => edge.target === responseNode.id,
        );
        const finalResults = incomingToResponse.map((edge) => {
          const srcNode = nodes.find((n) => n.id === edge.source);
          let label = srcNode?.id || "Source Node";
          let val = "";
          let type: "image" | "video" | "audio" | "text" = "text";

          if (srcNode) {
            if (nodeOutputs[srcNode.id] !== undefined) {
              const out = nodeOutputs[srcNode.id];
              if (out && typeof out === "object") {
                const outObj = out as Record<string, unknown>;
                val =
                  (outObj.url as string) || (outObj.response as string) || "";
              } else {
                val = String(out || "");
              }
            } else {
              if (srcNode.type === "requestInput") {
                const srcData = srcNode.data as RequestInputNodeData;
                const field = srcData.fields?.find(
                  (f) => f.id === edge.sourceHandle,
                );
                val = field?.value || "";
              } else if (srcNode.type === "cropImage") {
                const srcData = srcNode.data as CropImageNodeData;
                val = srcData.outputImage || "";
              } else if (srcNode.type === "textNode") {
                const srcData = srcNode.data as { response?: string };
                val = srcData.response || "";
              }
            }

            if (srcNode.type === "requestInput") {
              const srcData = srcNode.data as RequestInputNodeData;
              const field = srcData.fields?.find(
                (f) => f.id === edge.sourceHandle,
              );
              label = field?.label || "Input Field";
              if (field?.type === "image_field") {
                type = "image";
              } else if (field?.type === "video_field") {
                type = "video";
              } else if (field?.type === "audio_field") {
                type = "audio";
              } else {
                type = "text";
              }
            } else if (srcNode.type === "cropImage") {
              label = "Crop Image Output";
              type = "image";
            } else if (srcNode.type === "textNode") {
              label = "Text Output";
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

        nodes = nodes.map((n) =>
          n.id === responseNode.id
            ? {
                ...n,
                data: {
                  ...(n.data as Record<string, unknown>),
                  results: finalResults,
                },
              }
            : n,
        );
        await db.workflow.update({
          where: { id: workflow.id },
          data: { nodes: nodes as unknown as Prisma.InputJsonValue },
        });

        const respNodeRun = nodeRuns.find(
          (nr) => nr.nodeId === responseNode.id,
        );
        if (respNodeRun) {
          await db.nodeRun.update({
            where: { id: respNodeRun.id },
            data: {
              status: "SUCCESS",
              output: {
                results: finalResults,
              } as unknown as Prisma.InputJsonValue,
              completedAt: new Date(),
            },
          });
        }
      }

      const endTime = new Date();
      const runDuration = (endTime.getTime() - runStartTime.getTime()) / 1000;

      const hasFailed = executionNodeIds.some(
        (nodeId) => nodeState[nodeId] === "FAILED",
      );
      const hasSkipped = executionNodeIds.some(
        (nodeId) => nodeState[nodeId] === "SKIPPED",
      );
      const finalStatus = hasFailed
        ? "FAILED"
        : hasSkipped
          ? "PARTIAL"
          : "SUCCESS";

      await db.workflowRun.update({
        where: { id: workflowRunId },
        data: {
          status: finalStatus,
          completedAt: endTime,
          duration: runDuration,
        },
      });

      return { success: true };
    } catch (err) {
      console.error("Workflow execution orchestrator failed:", err);
      const endTime = new Date();
      const runDuration = (endTime.getTime() - runStartTime.getTime()) / 1000;

      await db.workflowRun.update({
        where: { id: workflowRunId },
        data: {
          status: "FAILED",
          completedAt: endTime,
          duration: runDuration,
        },
      });

      throw err;
    }
  },
});
