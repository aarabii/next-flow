import { db } from "@/lib/prisma";
import type { Node } from "@xyflow/react";
import type { ToolExecutionContext, ToolResult } from "./types";
import { Prisma } from "../../../generated/prisma/client";
import type { RequestInputField } from "@/types/node.type";

export interface AttachMediaArgs {
  nodeId?: string;
  mediaUrl: string;
  mediaType: "image" | "audio" | "video";
  targetProperty?: string;
}

export async function executeAttachMediaToNode(
  args: AttachMediaArgs,
  context: ToolExecutionContext,
): Promise<ToolResult> {
  try {
    const { mediaUrl, mediaType } = args;
    let { nodeId, targetProperty } = args;

    if (!mediaUrl) {
      return {
        toolName: "attach_media_to_node",
        success: false,
        message: "No media URL provided.",
      };
    }

    const currentNodes = [...context.currentNodes];

    // If nodeId is not provided, try to find an appropriate node
    if (!nodeId || nodeId === "auto") {
      if (mediaType === "image") {
        const targetNode =
          currentNodes.find((n) => n.type === "cropImage") ||
          currentNodes.find((n) => n.type === "textNode") ||
          currentNodes.find((n) => n.type === "requestInput");
        if (targetNode) nodeId = targetNode.id;
      } else {
        const targetNode = currentNodes.find((n) => n.type === "requestInput");
        if (targetNode) nodeId = targetNode.id;
      }
    }

    if (!nodeId) {
      return {
        toolName: "attach_media_to_node",
        success: false,
        message: "Could not find a suitable node to attach the media to.",
      };
    }

    let modified = false;
    let targetNodeLabel = nodeId;

    const updatedNodes = currentNodes.map((node) => {
      if (node.id !== nodeId) return node;

      const nodeData = { ...(node.data || {}) } as Record<string, unknown>;

      if (node.type === "cropImage") {
        nodeData.inputImage = mediaUrl;
        targetNodeLabel = "Crop Image node";
        modified = true;
      } else if (node.type === "textNode") {
        nodeData.imageInput = mediaUrl;
        targetNodeLabel = "Text Generation node";
        modified = true;
      } else if (node.type === "requestInput") {
        targetNodeLabel = "Request Inputs node";
        const fields = Array.isArray(nodeData.fields)
          ? ([...nodeData.fields] as RequestInputField[])
          : [];

        const expectedFieldType =
          mediaType === "image"
            ? "image_field"
            : mediaType === "audio"
              ? "audio_field"
              : "video_field";

        let fieldFound = false;
        const newFields = fields.map((f) => {
          if (
            f.id === targetProperty ||
            f.type === expectedFieldType ||
            (!fieldFound && f.type.includes(mediaType))
          ) {
            fieldFound = true;
            return { ...f, value: mediaUrl };
          }
          return f;
        });

        if (!fieldFound) {
          newFields.push({
            id: `${mediaType}_field_${Date.now()}`,
            type: expectedFieldType as RequestInputField["type"],
            label: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} Input`,
            value: mediaUrl,
          });
        }

        nodeData.fields = newFields;
        modified = true;
      } else {
        // Generic fallback property setting
        const prop = targetProperty || (mediaType === "image" ? "inputImage" : "mediaUrl");
        nodeData[prop] = mediaUrl;
        modified = true;
      }

      return {
        ...node,
        data: nodeData,
      };
    });

    if (!modified) {
      return {
        toolName: "attach_media_to_node",
        success: false,
        message: `Node ${nodeId} was not found on the canvas.`,
      };
    }

    await db.workflow.update({
      where: { id: context.workflowId },
      data: {
        nodes: updatedNodes as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      toolName: "attach_media_to_node",
      success: true,
      message: `Attached ${mediaType} to ${targetNodeLabel} (${nodeId}).`,
      nodes: updatedNodes,
      edges: context.currentEdges,
    };
  } catch (error) {
    console.error("executeAttachMediaToNode error:", error);
    return {
      toolName: "attach_media_to_node",
      success: false,
      message: error instanceof Error ? error.message : "Failed to attach media to node",
    };
  }
}
