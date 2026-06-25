import { redirect } from "next/navigation";
import { checkAndSyncUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { WorkflowCanvas } from "../_components/WorkflowCanvas";
import type { Node, Edge } from "@xyflow/react";
import { CustomNodeData } from "@/types/node.type";
import { Prisma } from "../../../../../generated/prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

const SAMPLE_NODES: Node<CustomNodeData>[] = [
  {
    id: "request_inputs",
    type: "requestInput",
    position: { x: 50, y: 150 },
    data: {
      fields: [
        { id: "text_field", type: "text_field", label: "Text Field", value: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design." },
        { id: "image_field", type: "image_field", label: "Image Field", value: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", fileName: "headphones.jpg" }
      ]
    },
    deletable: false,
  },
  {
    id: "crop_image_1",
    type: "cropImage",
    position: { x: 450, y: 50 },
    data: {
      x: 20,
      y: 20,
      width: 60,
      height: 60,
      inputImage: "",
      outputImage: "",
    },
  },
  {
    id: "crop_image_2",
    type: "cropImage",
    position: { x: 450, y: 350 },
    data: {
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      inputImage: "",
      outputImage: "",
    },
  },
  {
    id: "gemini_1",
    type: "gemini",
    position: { x: 450, y: 650 },
    data: {
      model: "Gemini 3.1 Pro",
      systemPrompt: "You are a marketing copywriter. Write a one-paragraph product description.",
      prompt: "",
      temperature: 0.7,
      topP: 0.95,
      maxTokens: 2048,
    },
  },
  {
    id: "gemini_2",
    type: "gemini",
    position: { x: 900, y: 650 },
    data: {
      model: "Gemini 3.1 Pro",
      systemPrompt: "Condense the following product description into a tweet-length hook (under 240 characters).",
      prompt: "",
      temperature: 0.7,
      topP: 0.95,
      maxTokens: 2048,
    },
  },
  {
    id: "gemini_3",
    type: "gemini",
    position: { x: 1350, y: 350 },
    data: {
      model: "Gemini 3.1 Pro",
      systemPrompt: "You are a social media manager. Combine the tweet hook and the two product crops into a final marketing post.",
      prompt: "",
      images: [],
      temperature: 0.7,
      topP: 0.95,
      maxTokens: 2048,
    },
  },
  {
    id: "response",
    type: "response",
    position: { x: 1800, y: 250 },
    data: {
      results: []
    },
    deletable: false,
  }
];

const SAMPLE_EDGES: Edge[] = [
  {
    id: "edge_req_crop1",
    source: "request_inputs",
    sourceHandle: "image_field",
    target: "crop_image_1",
    targetHandle: "inputImage",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
  },
  {
    id: "edge_req_crop2",
    source: "request_inputs",
    sourceHandle: "image_field",
    target: "crop_image_2",
    targetHandle: "inputImage",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
  },
  {
    id: "edge_req_gemini1",
    source: "request_inputs",
    sourceHandle: "text_field",
    target: "gemini_1",
    targetHandle: "prompt",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
  },
  {
    id: "edge_gemini1_gemini2",
    source: "gemini_1",
    sourceHandle: "response",
    target: "gemini_2",
    targetHandle: "prompt",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
  },
  {
    id: "edge_gemini2_gemini3",
    source: "gemini_2",
    sourceHandle: "response",
    target: "gemini_3",
    targetHandle: "prompt",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
  },
  {
    id: "edge_crop1_gemini3",
    source: "crop_image_1",
    sourceHandle: "outputImage",
    target: "gemini_3",
    targetHandle: "image",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
  },
  {
    id: "edge_crop2_gemini3",
    source: "crop_image_2",
    sourceHandle: "outputImage",
    target: "gemini_3",
    targetHandle: "image",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
  },
  {
    id: "edge_gemini3_response",
    source: "gemini_3",
    sourceHandle: "response",
    target: "response",
    targetHandle: "result",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
  },
  {
    id: "edge_crop2_response",
    source: "crop_image_2",
    sourceHandle: "outputImage",
    target: "response",
    targetHandle: "result",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
  }
];

export default async function WorkflowCanvasPage({ params }: PageProps) {
  const { id } = await params;
  const user = await checkAndSyncUser();

  const isSystemTemplate = ["ai-racing-car", "slack-dispatcher", "db-backup-sync"].includes(id);
  const targetId = isSystemTemplate ? `${user.id}-${id}` : id;

  let workflow = await db.workflow.findUnique({
    where: { id: targetId },
  });

  if (!workflow) {
    if (isSystemTemplate) {
      let name = "AI Racing Car Generator";
      if (id === "slack-dispatcher") name = "Slack Alert Dispatcher";
      if (id === "db-backup-sync") name = "Database Backup Sync";

      workflow = await db.workflow.create({
        data: {
          id: targetId,
          userId: user.id,
          name,
          nodes: SAMPLE_NODES as unknown as Prisma.InputJsonValue,
          edges: SAMPLE_EDGES as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      redirect("/dashboard");
    }
  }

  if (workflow.userId !== user.id) {
    redirect("/dashboard");
  }

  const initialNodes = (workflow.nodes as unknown as Node[]) || [];
  const initialEdges = (workflow.edges as unknown as Edge[]) || [];

  return (
    <div className="relative w-full h-full min-h-screen bg-zinc-50 flex flex-col text-zinc-900">
      <WorkflowCanvas
        workflowId={targetId}
        workflowName={workflow.name}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
      />
    </div>
  );
}

