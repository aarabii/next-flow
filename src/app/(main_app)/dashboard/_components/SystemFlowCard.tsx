"use client";

import Link from "next/link";
import Image from "next/image";
import { SYSTEM_WORKFLOWS } from "@/config/systemWorkflows";
import { Sparkles, Wand2, Laptop, Code2, Music } from "lucide-react";

const getIcon = (id: string) => {
  switch (id) {
    case "social-media-post":
      return <Sparkles className="w-12 h-12 text-indigo-500/70" />;
    case "who-am-i":
      return <Wand2 className="w-12 h-12 text-pink-500/70" />;
    case "code-audit":
      return <Code2 className="w-12 h-12 text-emerald-500/70" />;
    case "mini-shazam":
      return <Music className="w-12 h-12 text-blue-500/70" />;
    default:
      return <Laptop className="w-12 h-12 text-emerald-500/70" />;
  }
};

export const SystemFlowCard = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-06 w-full">
      {SYSTEM_WORKFLOWS.map((workflow) => (
        <Link
          key={workflow.id}
          className="group w-full overflow-hidden rounded-radius-xxl border border-width-s border-boarder-tertiary bg-surface-main-background-2 text-left transition-colors hover:border-boarder-secondary"
          href={`/workflows/${workflow.id}`}
        >
          <div className={`relative ${workflow.backgroundImage ? "aspect-square" : "aspect-288/196"} bg-surface-main-background-3 flex items-center justify-center bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] overflow-hidden bg-size-[16px_16px]`}>
            {workflow.backgroundImage ? (
              <>
                <Image
                  src={workflow.backgroundImage}
                  alt={workflow.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  loading="lazy"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/5 transition-opacity group-hover:bg-black/10" />
              </>
            ) : (
              <>
                <div
                  className={`absolute inset-0 bg-linear-to-br ${workflow.gradient} opacity-60`}
                />
                <div className="relative transition-transform duration-300 group-hover:scale-110">
                  {getIcon(workflow.id)}
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col px-space-05 py-space-04">
            <div className="truncate text-body text-text-primary font-medium font-secondary">
              {workflow.name}
            </div>
            {workflow.description && (
              <div className="truncate text-xs text-text-secondary mt-0.5">
                {workflow.description}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};
