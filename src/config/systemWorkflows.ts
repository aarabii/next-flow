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
    backgroundImage: "https://pub-e8fef8c0e03b44acb340577811800829.r2.dev/39e8efa449ed4997a82600399d279aa0/c12ba2d07db34f9f92985e1848b55be3/f5b9645580e1425cbfa2b3faf9b70b9a.png",
    nodes: socialMediaPostData.nodes,
    edges: socialMediaPostData.edges,
    gradient: "from-indigo-500/20 via-purple-500/20 to-pink-500/10",
  },
  {
    id: "who-am-i",
    name: "WHO AM I",
    description: "Describe the uploaded image in detail using Gemini",
    backgroundImage: "https://pub-e8fef8c0e03b44acb340577811800829.r2.dev/39e8efa449ed4997a82600399d279aa0/96cd890943104c60afd47e1ac3283e5f/4c83bf78343b4b0d9666543e5c88d17c.png",
    nodes: whoAmIData.nodes,
    edges: whoAmIData.edges,
    gradient: "from-purple-500/20 via-pink-500/20 to-red-500/10",
  },
  {
    id: "code-audit",
    name: "Code Audit",
    description: "Analyze and explain source code architecture, logic, and patterns",
    backgroundImage: "https://pub-e8fef8c0e03b44acb340577811800829.r2.dev/39e8efa449ed4997a82600399d279aa0/e51f224f5cbb4de3bcf405740afa030c/91b03e4b98b4433eb17560f0bff9bb2d.png",
    nodes: codeAuditData.nodes,
    edges: codeAuditData.edges,
    gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/10",
  },
];

export const SYSTEM_WORKFLOW_IDS = SYSTEM_WORKFLOWS.map((sw) => sw.id);
