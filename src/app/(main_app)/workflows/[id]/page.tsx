import { WorkflowCanvas } from "../_components/WorkflowCanvas";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowCanvasPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="relative w-full h-full min-h-screen bg-zinc-50 flex flex-col text-zinc-900">
      {/* Workflow Header */}
      <div className="h-16 px-6 border-b border-zinc-200 bg-white flex items-center justify-between z-10 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-700">Workflow</span>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-mono text-pink-500 bg-pink-50 px-2 py-0.5 rounded border border-pink-100/50">{id}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-semibold text-zinc-600 transition-colors shadow-2xs cursor-pointer">
            Export JSON
          </button>
          <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer">
            Publish
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full h-[calc(100vh-64px)] relative">
        <WorkflowCanvas workflowId={id} />
      </div>
    </div>
  );
}

