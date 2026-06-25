"use client";

import * as React from "react";
import { SearchBar } from "./SearchBar";
import { UserFlowCard } from "./UserFlowCard";
import { useDashboardStore } from "@/hooks/useDashboardStore";

interface UserWorkflow {
  id: string;
  title: string;
  href: string;
  editedAt: string;
  gradient: string;
  backgroundImage?: string | null;
}

interface UserWorkflowsContainerProps {
  initialWorkflows: UserWorkflow[];
}

export function UserWorkflowsContainer({ initialWorkflows }: UserWorkflowsContainerProps) {
  const { searchQuery, setSearchQuery } = useDashboardStore();

  const filteredWorkflows = React.useMemo(() => {
    return initialWorkflows.filter((workflow) =>
      workflow.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialWorkflows, searchQuery]);

  return (
    <>
      <div className="flex flex-col gap-space-04 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-body text-text-primary font-medium">Your Workflows</div>
          <div className="text-small text-text-secondary">
            Open one to edit, run, and review history.
          </div>
        </div>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>
      <UserFlowCard initialWorkflows={initialWorkflows} workflows={filteredWorkflows} />
    </>
  );
}
