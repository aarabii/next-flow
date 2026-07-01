import socialMediaPostData from "./system-workflows/social-media-post.json";
import whoAmIData from "./system-workflows/who-am-i.json";
import codeAuditData from "./system-workflows/code-audit.json";

import type { Node, Edge } from "@xyflow/react";

export interface SystemWorkflow {
  id: string;
  name: string;
  description: string | null;
  backgroundImage: string | null;
  nodes: Node[];
  edges: Edge[];
  gradient: string;
}

export const SYSTEM_WORKFLOWS: SystemWorkflow[] = [
  {
    id: "social-media-post",
    name: "Social Media Post",
    description: "Combine text hooks and image crops into a styled post",
    backgroundImage: "/assets/social-media.png",
    nodes: socialMediaPostData.nodes,
    edges: socialMediaPostData.edges,
    gradient: "from-indigo-500/20 via-purple-500/20 to-pink-500/10",
  },
  {
    id: "who-am-i",
    name: "WHO AM I",
    description: "Describe the uploaded image in detail using Gemini",
    backgroundImage: "/assets/who-am-ai.png",
    nodes: whoAmIData.nodes,
    edges: whoAmIData.edges,
    gradient: "from-purple-500/20 via-pink-500/20 to-red-500/10",
  },
  {
    id: "code-audit",
    name: "Code Audit",
    description: "Analyze and explain source code architecture, logic, and patterns",
    backgroundImage: "/assets/code-audit.png",
    nodes: codeAuditData.nodes,
    edges: codeAuditData.edges,
    gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/10",
  },
];

export const SYSTEM_WORKFLOW_IDS = SYSTEM_WORKFLOWS.map((sw) => sw.id);
