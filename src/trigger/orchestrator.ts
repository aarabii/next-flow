import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/prisma";
import { cropImageTask } from "./cropImage";
import { geminiTask } from "./gemini";

export interface OrchestratorPayload {
  workflowRunId: string;
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
    const nodes = workflow.nodes as any[];
    const edges = workflow.edges as any[];

    // 2. Fetch all NodeRun records created for this run
    const nodeRuns = await db.nodeRun.findMany({
      where: { workflowRunId },
    });

    // We only execute nodes that are in PENDING status in the database
    const pendingNodeRuns = nodeRuns.filter((nr) => nr.status === "PENDING");
    const executionNodeIds = pendingNodeRuns.map((nr) => nr.nodeId);

    // Keep track of executing promises for dependency coordination
    const executionPromises: { [nodeId: string]: Promise<any> } = {};
    const nodeOutputs: { [nodeId: string]: any } = {};

    // Helper to find dependencies (upstream nodes) of a node
    const getUpstreamDependencies = (nodeId: string) => {
      return edges
        .filter((edge) => edge.target === nodeId)
        .map((edge) => edge.source);
    };

    // Helper to resolve inputs for a node
    const resolveInputs = async (nodeId: string, node: any) => {
      const incomingEdges = edges.filter((edge) => edge.target === nodeId);
      const resolved: any = {};

      // 1. Initialize with manual/configured node data values
      if (node.type === "cropImage") {
        resolved.x = node.data.x !== undefined ? Number(node.data.x) : 0;
        resolved.y = node.data.y !== undefined ? Number(node.data.y) : 0;
        resolved.width = node.data.width !== undefined ? Number(node.data.width) : 100;
        resolved.height = node.data.height !== undefined ? Number(node.data.height) : 100;
        resolved.imageUrl = node.data.inputImage || "";
      } else if (node.type === "gemini") {
        resolved.prompt = node.data.prompt || "";
        resolved.systemPrompt = node.data.systemPrompt || "";
        resolved.temperature = node.data.temperature !== undefined ? Number(node.data.temperature) : 0.7;
        resolved.topP = node.data.topP !== undefined ? Number(node.data.topP) : 0.9;
        resolved.maxTokens = node.data.maxTokens !== undefined ? Number(node.data.maxTokens) : 2048;
        resolved.images = [];
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
            sourceVal = out.url || out.response || "";
          } else {
            sourceVal = out || "";
          }
        } else {
          const srcNode = nodes.find((n) => n.id === sourceId);
          if (srcNode) {
            if (srcNode.type === "requestInput") {
              const field = srcNode.data.fields?.find((f: any) => f.id === sourceHandle);
              sourceVal = field?.value || "";
            } else if (srcNode.type === "cropImage") {
              sourceVal = srcNode.data.outputImage || "";
            } else if (srcNode.type === "gemini") {
              sourceVal = srcNode.data.response || "";
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
          if (targetHandle === "system") resolved.systemPrompt = sourceVal;
          if (targetHandle === "image") {
            // Multimodal Image (Vision) accepts multiple connections
            if (sourceVal) resolved.images.push(sourceVal);
          }
          if (targetHandle === "video") resolved.video = sourceVal;
          if (targetHandle === "audio") resolved.audio = sourceVal;
          if (targetHandle === "file") resolved.file = sourceVal;
        }
      }

      return resolved;
    };

    // Main execution function per node
    const executeNode = async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      const nodeRun = pendingNodeRuns.find((nr) => nr.nodeId === nodeId);

      if (!node || !nodeRun) return null;

      // Await all upstream dependencies that are also being run in this execution
      const upstreamIds = getUpstreamDependencies(nodeId);
      const activeUpstreams = upstreamIds.filter((uid) => executionNodeIds.includes(uid));

      await Promise.all(activeUpstreams.map((uid) => executionPromises[uid]));

      // Resolve the inputs (pull from parent output or manual data)
      const inputs = await resolveInputs(nodeId, node);

      // Trigger the node run task
      let result: any = null;

      if (node.type === "cropImage") {
        const taskRun = await cropImageTask.triggerAndWait({
          nodeRunId: nodeRun.id,
          imageUrl: inputs.imageUrl,
          x: inputs.x,
          y: inputs.y,
          width: inputs.width,
          height: inputs.height,
        });

        if (taskRun.ok) {
          result = taskRun.output;
          nodeOutputs[nodeId] = result;

          // Save back output image to Workflow nodes in DB for UI visibility
          const updatedNodes = nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, outputImage: result.url } } : n
          );
          await db.workflow.update({
            where: { id: workflow.id },
            data: { nodes: updatedNodes },
          });
        } else {
          throw new Error((taskRun as any).error?.message || "Crop Image task failed");
        }
      } else if (node.type === "gemini") {
        const taskRun = await geminiTask.triggerAndWait({
          nodeRunId: nodeRun.id,
          model: node.data.model || "Gemini 3.1 Pro",
          prompt: inputs.prompt,
          systemPrompt: inputs.systemPrompt,
          images: inputs.images,
          temperature: inputs.temperature,
          topP: inputs.topP,
          maxTokens: inputs.maxTokens,
        });

        if (taskRun.ok) {
          result = taskRun.output;
          nodeOutputs[nodeId] = result;

          // Save back Gemini response text to Workflow nodes in DB for UI visibility
          const updatedNodes = nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, response: result.response } } : n
          );
          await db.workflow.update({
            where: { id: workflow.id },
            data: { nodes: updatedNodes },
          });
        } else {
          throw new Error((taskRun as any).error?.message || "Gemini task failed");
        }
      }

      return result;
    };

    try {
      // 3. Kick off execution for all targeted nodes
      // Since dependencies are awaited in topological order inside executeNode,
      // we can safely kick them all off concurrently!
      for (const nodeId of executionNodeIds) {
        executionPromises[nodeId] = executeNode(nodeId);
      }

      // Wait for all execution promises to complete
      await Promise.all(Object.values(executionPromises));

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
              val = out?.url || out?.response || "";
            } else {
              if (srcNode.type === "requestInput") {
                const field = srcNode.data.fields?.find((f: any) => f.id === edge.sourceHandle);
                val = field?.value || "";
              } else if (srcNode.type === "cropImage") {
                val = srcNode.data.outputImage || "";
              } else if (srcNode.type === "gemini") {
                val = srcNode.data.response || "";
              }
            }

            if (srcNode.type === "requestInput") {
              const field = srcNode.data.fields?.find((f: any) => f.id === edge.sourceHandle);
              label = field?.label || "Input Field";
              type = field?.type === "image_field" ? "image" : "text";
            } else if (srcNode.type === "cropImage") {
              label = "Crop Image Output";
              type = "image";
            } else if (srcNode.type === "gemini") {
              label = `${srcNode.data.model || "Gemini"} Response`;
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

        // Save Response results to Workflow nodes in DB for UI visibility
        const updatedNodes = nodes.map((n) =>
          n.id === responseNode.id ? { ...n, data: { ...n.data, results: finalResults } } : n
        );
        await db.workflow.update({
          where: { id: workflow.id },
          data: { nodes: updatedNodes },
        });

        // Update the Response NodeRun
        const respNodeRun = nodeRuns.find((nr) => nr.nodeId === responseNode.id);
        if (respNodeRun) {
          await db.nodeRun.update({
            where: { id: respNodeRun.id },
            data: {
              status: "SUCCESS",
              output: { results: finalResults },
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
    } catch (err: any) {
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
