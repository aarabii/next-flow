import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/prisma";
import { cropImageTask } from "./cropImage";
import { geminiTask } from "./gemini";
import { GEMINI_MODEL_CONFIG } from "../config/modelConfig";
import { type Node, type Edge } from "@xyflow/react";
import { Prisma } from "../../generated/prisma/client";
import {
  RequestInputField,
  RequestInputNodeData,
  CropImageNodeData,
  GeminiNodeData,
  TextNodeData,
  ImageNodeData,
  VideoNodeData,
  AudioNodeData,
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
  model?: string;
  images: string[];
  video?: string;
  audio?: string;
  imageInput?: string;
  [key: string]: unknown;
}

function getTopologicalOrder(nodeIds: string[], edges: Edge[]): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      // Handle cycle gracefully by ignoring
      return;
    }
    visiting.add(id);

    // Get upstream dependencies of this node
    const dependencies = edges
      .filter((edge) => edge.target === id)
      .map((edge) => edge.source);

    for (const depId of dependencies) {
      if (nodeIds.includes(depId)) {
        visit(depId);
      }
    }

    visiting.delete(id);
    visited.add(id);
    order.push(id);
  };

  for (const id of nodeIds) {
    visit(id);
  }

  return order;
}

export const workflowOrchestratorTask = task({
  id: "workflow-orchestrator",
  run: async (payload: OrchestratorPayload) => {
    const { workflowRunId } = payload;
    const runStartTime = new Date();

    // 1. Fetch WorkflowRun and Workflow
    const workflowRun = await db.workflowRun.findUnique({
      where: { id: workflowRunId },
      include: { workflow: true },
    });

    if (!workflowRun) {
      throw new Error(`WorkflowRun ${workflowRunId} not found`);
    }

    const workflow = workflowRun.workflow;
    let nodes = workflow.nodes as unknown as Node[];
    const edges = workflow.edges as unknown as Edge[];

    // 2. Fetch all NodeRun records created for this run
    const nodeRuns = await db.nodeRun.findMany({
      where: { workflowRunId },
    });

    // We only execute nodes that are in PENDING status in the database
    const pendingNodeRuns = nodeRuns.filter((nr) => nr.status === "PENDING");
    const executionNodeIds = pendingNodeRuns.map((nr) => nr.nodeId);

    const nodeOutputs: { [nodeId: string]: unknown } = {};

    // Helper to find dependencies (upstream nodes) of a node
    const getUpstreamDependencies = (nodeId: string) => {
      return edges
        .filter((edge) => edge.target === nodeId)
        .map((edge) => edge.source);
    };

    // Helper to resolve inputs for a node
    const resolveInputs = async (nodeId: string, node: Node) => {
      const incomingEdges = edges.filter((edge) => edge.target === nodeId);
      const resolved: ResolvedInputs = { images: [] };

      // 1. Initialize with manual/configured node data values
      if (node.type === "cropImage") {
        const data = node.data as CropImageNodeData;
        resolved.x = data.x !== undefined ? Number(data.x) : 0;
        resolved.y = data.y !== undefined ? Number(data.y) : 0;
        resolved.width = data.width !== undefined ? Number(data.width) : 100;
        resolved.height = data.height !== undefined ? Number(data.height) : 100;
        resolved.imageUrl = data.inputImage || "";
      } else if (node.type === "gemini") {
        const data = node.data as GeminiNodeData;
        resolved.prompt = data.promptEnabled !== false ? (data.prompt || "") : "";
        resolved.systemPrompt = data.systemPrompt || "";
        resolved.temperature = data.temperature !== undefined ? Number(data.temperature) : 0.7;
        resolved.topP = data.topP !== undefined ? Number(data.topP) : 0.9;
        resolved.maxTokens = data.maxTokens !== undefined ? Number(data.maxTokens) : 2048;
        resolved.model = data.model || "";
        resolved.images = [];
        resolved.video = data.video || "";
        resolved.audio = data.audio || "";
      } else if (
        node.type === "textNode" ||
        node.type === "imageNode" ||
        node.type === "videoNode" ||
        node.type === "audioNode"
      ) {
        const data = node.data as TextNodeData;
        resolved.systemPrompt = data.systemPrompt || "";
        resolved.temperature = data.temperature !== undefined ? Number(data.temperature) : 0.7;
        resolved.topP = data.topP !== undefined ? Number(data.topP) : 0.95;
        resolved.maxTokens = data.maxTokens !== undefined ? Number(data.maxTokens) : 2048;
        resolved.model = "";
        resolved.images = [];
        resolved.video = "";
        resolved.audio = "";

        const fieldsList = data.fields ? JSON.parse(JSON.stringify(data.fields)) as RequestInputField[] : [
          { id: "prompt", type: "text_field" as const, label: "Prompt", value: data.prompt || "" },
        ];
        if (!data.fields && data.imageInput) {
          fieldsList.push({ id: "image_input", type: "image_field" as const, label: "Input Image", value: data.imageInput });
        }
        resolved.fieldsList = fieldsList;
      }

      // 2. Map connected inputs
      for (const edge of incomingEdges) {
        const sourceId = edge.source;
        const sourceHandle = edge.sourceHandle;
        const targetHandle = edge.targetHandle;

        // Resolve value from the source node
        let sourceVal = "";
        
        // If the source node was executed in this run, use its output. Otherwise, read from workflow node data.
        if (nodeOutputs[sourceId] !== undefined) {
          const out = nodeOutputs[sourceId];
          if (out && typeof out === "object") {
            const outObj = out as Record<string, unknown>;
            sourceVal = (outObj.url as string) || (outObj.response as string) || "";
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
            } else if (
              srcNode.type === "gemini" ||
              srcNode.type === "textNode" ||
              srcNode.type === "imageNode" ||
              srcNode.type === "videoNode" ||
              srcNode.type === "audioNode"
            ) {
              const srcData = srcNode.data as GeminiNodeData;
              sourceVal = srcData.response || "";
            }
          }
        }

        // Apply resolved values to target handles
        if (node.type === "cropImage") {
          if (targetHandle === "inputImage") resolved.imageUrl = sourceVal;
          if (targetHandle === "x") resolved.x = Number(sourceVal);
          if (targetHandle === "y") resolved.y = Number(sourceVal);
          if (targetHandle === "width") resolved.width = Number(sourceVal);
          if (targetHandle === "height") resolved.height = Number(sourceVal);
        } else if (node.type === "gemini") {
          if (targetHandle === "prompt") resolved.prompt = sourceVal;
          if (targetHandle === "system" || targetHandle === "systemPrompt") resolved.systemPrompt = sourceVal;
          if (targetHandle === "image" || targetHandle?.startsWith("image_")) {
            // Multimodal Image (Vision) accepts multiple connections
            if (sourceVal) resolved.images.push(sourceVal);
          }
          if (targetHandle === "video") resolved.video = sourceVal;
          if (targetHandle === "audio") resolved.audio = sourceVal;
        } else if (
          node.type === "textNode" ||
          node.type === "imageNode" ||
          node.type === "videoNode" ||
          node.type === "audioNode"
        ) {
          const fieldsList = resolved.fieldsList as RequestInputField[] | undefined;
          if (fieldsList) {
            const field = fieldsList.find((f) => f.id === targetHandle);
            if (field) {
              field.value = sourceVal;
            }
          }
          if (targetHandle === "prompt") resolved.prompt = sourceVal;
          if (targetHandle === "system" || targetHandle === "systemPrompt") resolved.systemPrompt = sourceVal;
          if (targetHandle === "image_input") {
            resolved.imageInput = sourceVal;
            if (sourceVal) resolved.images.push(sourceVal);
          }
        }
      }

      // 3. Compile prompt and media from fieldsList for textNode / imageNode / videoNode / audioNode
      if (
        node.type === "textNode" ||
        node.type === "imageNode" ||
        node.type === "videoNode" ||
        node.type === "audioNode"
      ) {
        const fieldsList = resolved.fieldsList as RequestInputField[] | undefined;
        if (fieldsList) {
          const prompts: string[] = [];
          for (const field of fieldsList) {
            if (field.type === "text_field") {
              if (field.value) prompts.push(field.value);
            } else if (field.type === "image_field") {
              if (field.value) resolved.images.push(field.value);
            } else if (field.type === "video_field") {
              if (field.value) resolved.video = field.value;
            } else if (field.type === "audio_field") {
              if (field.value) resolved.audio = field.value;
            }
          }
          if (prompts.length > 0) {
            resolved.prompt = prompts.join("\n\n");
          }
        }
      }

      return resolved;
    };

    // Main execution function per node
    const executeNode = async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      const nodeRun = pendingNodeRuns.find((nr) => nr.nodeId === nodeId);

      if (!node || !nodeRun) return null;

      // Dependencies are already executed sequentially in topological order

      // Resolve the inputs (pull from parent output or manual data)
      const inputs = await resolveInputs(nodeId, node);

      // Trigger the node run task
      let result: unknown = null;

      if (node.type === "cropImage") {
        const taskRun = await cropImageTask.triggerAndWait({
          nodeRunId: nodeRun.id,
          imageUrl: inputs.imageUrl || "",
          x: inputs.x || 0,
          y: inputs.y || 0,
          width: inputs.width || 100,
          height: inputs.height || 100,
        });

        if (taskRun.ok) {
          result = taskRun.output;
          nodeOutputs[nodeId] = result;
          const outputObj = result as { url: string };

          // Save back output image to Workflow nodes in DB for UI visibility
          nodes = nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...(n.data as Record<string, unknown>),
                    outputImage: outputObj.url,
                  },
                }
              : n
          );
          await db.workflow.update({
            where: { id: workflow.id },
            data: { nodes: nodes as unknown as Prisma.InputJsonValue },
          });
        } else {
          throw new Error(
            (taskRun as { error?: { message?: string } }).error?.message ||
              "Crop Image task failed"
          );
        }
      } else if (
        node.type === "gemini" ||
        node.type === "textNode" ||
        node.type === "imageNode" ||
        node.type === "videoNode" ||
        node.type === "audioNode"
      ) {
        const nodeModel = (node.data as GeminiNodeData).model || GEMINI_MODEL_CONFIG.modelId;
        const taskRun = await geminiTask.triggerAndWait({
          nodeRunId: nodeRun.id,
          model: inputs.model || nodeModel,
          nodeType: node.type,
          prompt: inputs.prompt,
          systemPrompt: inputs.systemPrompt,
          images: inputs.images,
          video: inputs.video,
          audio: inputs.audio,
          temperature: inputs.temperature,
          topP: inputs.topP,
          maxTokens: inputs.maxTokens,
        });

        if (taskRun.ok) {
          result = taskRun.output;
          nodeOutputs[nodeId] = result;
          const outputObj = result as { response: string };

          // Save back Gemini response text to Workflow nodes in DB for UI visibility
          nodes = nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...(n.data as Record<string, unknown>),
                    response: outputObj.response,
                  },
                }
              : n
          );
          await db.workflow.update({
            where: { id: workflow.id },
            data: { nodes: nodes as unknown as Prisma.InputJsonValue },
          });
        } else {
          throw new Error(
            (taskRun as { error?: { message?: string } }).error?.message ||
              `${node.type} task failed`
          );
        }
      }

      return result;
    };

    try {
      // 3. Sort targeted nodes topologically to respect dependencies
      const sortedNodeIds = getTopologicalOrder(executionNodeIds, edges);

      // Execute nodes sequentially to avoid TASK_DID_CONCURRENT_WAIT errors in Trigger.dev
      for (const nodeId of sortedNodeIds) {
        const result = await executeNode(nodeId);
        nodeOutputs[nodeId] = result;
      }

      // 4. Update the Response node's output results dynamically at the end
      const responseNode = nodes.find((n) => n.type === "response");
      if (responseNode) {
        const incomingToResponse = edges.filter((edge) => edge.target === responseNode.id);
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
                val = (outObj.url as string) || (outObj.response as string) || "";
              } else {
                val = String(out || "");
              }
            } else {
              if (srcNode.type === "requestInput") {
                const srcData = srcNode.data as RequestInputNodeData;
                const field = srcData.fields?.find((f) => f.id === edge.sourceHandle);
                val = field?.value || "";
              } else if (srcNode.type === "cropImage") {
                const srcData = srcNode.data as CropImageNodeData;
                val = srcData.outputImage || "";
              } else if (
                srcNode.type === "gemini" ||
                srcNode.type === "textNode" ||
                srcNode.type === "imageNode" ||
                srcNode.type === "videoNode" ||
                srcNode.type === "audioNode"
              ) {
                const srcData = srcNode.data as GeminiNodeData;
                val = srcData.response || "";
              }
            }

            if (srcNode.type === "requestInput") {
              const srcData = srcNode.data as RequestInputNodeData;
              const field = srcData.fields?.find((f) => f.id === edge.sourceHandle);
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
            } else if (srcNode.type === "imageNode") {
              label = "Image Output";
              type = "image";
            } else if (srcNode.type === "videoNode") {
              label = "Video Output";
              type = "video";
            } else if (srcNode.type === "audioNode") {
              label = "Audio Output";
              type = "audio";
            } else if (srcNode.type === "gemini") {
              const srcData = srcNode.data as GeminiNodeData;
              label = `${srcData.model || "Gemini"} Response`;
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

        // Save Response results to Workflow nodes in DB for UI visibility
        nodes = nodes.map((n) =>
          n.id === responseNode.id
            ? {
                ...n,
                data: {
                  ...(n.data as Record<string, unknown>),
                  results: finalResults,
                },
              }
            : n
        );
        await db.workflow.update({
          where: { id: workflow.id },
          data: { nodes: nodes as unknown as Prisma.InputJsonValue },
        });

        // Update the Response NodeRun
        const respNodeRun = nodeRuns.find((nr) => nr.nodeId === responseNode.id);
        if (respNodeRun) {
          await db.nodeRun.update({
            where: { id: respNodeRun.id },
            data: {
              status: "SUCCESS",
              output: { results: finalResults } as unknown as Prisma.InputJsonValue,
              completedAt: new Date(),
            },
          });
        }
      }

      // 5. Update WorkflowRun status to SUCCESS
      const endTime = new Date();
      const runDuration = (endTime.getTime() - runStartTime.getTime()) / 1000;

      await db.workflowRun.update({
        where: { id: workflowRunId },
        data: {
          status: "SUCCESS",
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
