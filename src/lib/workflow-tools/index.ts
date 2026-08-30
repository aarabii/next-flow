import { Type, type Tool } from "@google/genai";
import { executeCreateOrUpdateWorkflow, type CreateWorkflowArgs } from "./createWorkflowTool";
import { executeRunWorkflow, type RunWorkflowArgs } from "./runWorkflowTool";
import { executeAttachMediaToNode, type AttachMediaArgs } from "./attachMediaTool";
import { executeSetWorkflowBackground, type SetBackgroundArgs } from "./setBackgroundTool";
import { executeNameWorkflow, type NameWorkflowArgs } from "./nameWorkflowTool";
import type { ToolExecutionContext, ToolResult } from "./types";

export * from "./types";
export * from "./createWorkflowTool";
export * from "./runWorkflowTool";
export * from "./attachMediaTool";
export * from "./setBackgroundTool";
export * from "./nameWorkflowTool";

export const geminiWorkflowToolDeclarations: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "create_or_update_workflow",
        description:
          "Create, build, or modify the visual workflow graph nodes and edges. Use this whenever the user wants to create a new workflow or alter existing node configurations, connections, or layouts.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description:
                "A concise, descriptive, and catchy title for the workflow (e.g. 'Social Media Studio', 'Visual Document Auditor').",
            },
            description: {
              type: Type.STRING,
              description:
                "An optional 1-sentence description explaining what the workflow accomplishes.",
            },
            nodes: {
              type: Type.ARRAY,
              description:
                "Complete array of NextFlow nodes (requestInput, textNode, cropImage, response). Each with id, type, position {x, y}, and data.",
              items: { type: Type.OBJECT },
            },
            edges: {
              type: Type.ARRAY,
              description:
                "Complete array of NextFlow edges connecting source handles to target handles.",
              items: { type: Type.OBJECT },
            },
            summary: {
              type: Type.STRING,
              description:
                "Brief 1-2 sentence description of the workflow structure created or modified.",
            },
          },
          required: ["nodes", "edges"],
        },
      },
      {
        name: "run_workflow",
        description:
          "Execute the full workflow or run a specific single node. Use when the user asks to run, test, or execute the workflow or a node.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            scope: {
              type: Type.STRING,
              description:
                "Execution scope: 'FULL' to execute all nodes in topological order, 'SINGLE' to execute one specific node, 'PARTIAL' to execute a chosen subset of nodes.",
              enum: ["FULL", "SINGLE", "PARTIAL"],
            },
            targetNodeIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "Array of node IDs to run if scope is SINGLE or PARTIAL.",
            },
          },
          required: ["scope"],
        },
      },
      {
        name: "attach_media_to_node",
        description:
          "Attach an uploaded image, audio, or video URL to a target node (such as cropImage, textNode, or requestInput). Use when the user shares or uploads media and wants to connect/attach it to a node or input.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            nodeId: {
              type: Type.STRING,
              description:
                "ID of the target node (e.g. 'cropImage_1', 'textNode_1', 'request_inputs', or 'auto').",
            },
            mediaUrl: {
              type: Type.STRING,
              description: "The URL of the media file to attach.",
            },
            mediaType: {
              type: Type.STRING,
              description: "Type of media: 'image', 'audio', or 'video'.",
              enum: ["image", "audio", "video"],
            },
            targetProperty: {
              type: Type.STRING,
              description:
                "Optional specific node property or input field ID (e.g. 'inputImage', 'imageInput', 'image_field').",
            },
          },
          required: ["mediaUrl", "mediaType"],
        },
      },
      {
        name: "set_workflow_background",
        description:
          "Set or update the background image URL for this workflow card. Use when the user asks to change the workflow card background.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            backgroundImageUrl: {
              type: Type.STRING,
              description: "Image URL for the workflow card background.",
            },
          },
          required: ["backgroundImageUrl"],
        },
      },
      {
        name: "generate_workflow_name",
        description:
          "Generate a creative, descriptive, and concise name (and optional summary description) for this workflow based on its purpose or nodes. Use when the user asks to name, rename, or generate a title for the workflow.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description:
                "A concise, catchy, and descriptive title for the workflow (e.g., 'Social Media Copywriter', 'Image Crop & Vision Pipeline').",
            },
            description: {
              type: Type.STRING,
              description:
                "An optional 1-2 sentence description explaining what the workflow accomplishes.",
            },
          },
          required: ["name"],
        },
      },
    ],
  },
];

export async function executeWorkflowTool(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolExecutionContext,
): Promise<ToolResult> {
  switch (toolName) {
    case "create_or_update_workflow":
      return await executeCreateOrUpdateWorkflow(
        args as unknown as CreateWorkflowArgs,
        context,
      );
    case "run_workflow":
      return await executeRunWorkflow(
        args as unknown as RunWorkflowArgs,
        context,
      );
    case "attach_media_to_node":
      return await executeAttachMediaToNode(
        args as unknown as AttachMediaArgs,
        context,
      );
    case "set_workflow_background":
      return await executeSetWorkflowBackground(
        args as unknown as SetBackgroundArgs,
        context,
      );
    case "generate_workflow_name":
      return await executeNameWorkflow(
        args as unknown as NameWorkflowArgs,
        context,
      );
    default:
      return {
        toolName,
        success: false,
        message: `Unknown tool: ${toolName}`,
      };
  }
}
