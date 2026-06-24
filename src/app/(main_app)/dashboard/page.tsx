import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";
import { SystemFlowCard } from "./_components/SystemFlowCard";
import { SearchBar } from "./_components/SearchBar";
import { UserFlowCard } from "./_components/UserFlowCard";

export default function DashboardPage() {
  return (
    <div>
      {
        // header
      }
      <div>
        <div>
          <h1>NextFlow</h1>
          <p>Build workflows or run models directly</p>
        </div>
        <div>
          <Button className="rounded-md">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button className="rounded-md">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {
        // System workflows
      }
      <div>
        <div>
          <h1>System Workflows</h1>
          <p>Prebuilt workflow templates - click to open and start using.</p>
        </div>
        <SystemFlowCard />
      </div>

      {
        // user workflows
      }
      <div>
        <div>
          <div>
            <h1>Your Workflows</h1>
            <p>Open one to edit, run, and review history.</p>
          </div>
          <SearchBar />
        </div>
        <UserFlowCard />
      </div>
    </div>
  );
}
