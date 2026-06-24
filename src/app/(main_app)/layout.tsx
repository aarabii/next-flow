"use client";

import type { ReactNode } from "react";
import { Navigation } from "./_components/Navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="h-full flex w-full">
          <Navigation />
          <main className="flex-1 h-full overflow-y-auto">{children}</main>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}
