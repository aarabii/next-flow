"use client";

import type { ReactNode } from "react";
import { Navigation } from "./_components/Navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="h-screen flex flex-col md:flex-row w-full overflow-hidden bg-background">
          {/* Mobile Top Bar */}
          <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden shrink-0 z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <strong className="text-sm font-semibold text-zinc-800 font-secondary">
                NextFlow
              </strong>
            </div>
            <span className="text-xs text-muted-foreground bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100 font-medium">
              Workflow Editor
            </span>
          </header>

          <div className="flex-1 flex w-full h-full overflow-hidden relative">
            <Navigation />
            <main className="flex-1 h-full overflow-y-auto relative">{children}</main>
          </div>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}
