import { db } from "./src/lib/prisma";

async function main() {
  const workflowId = "c1bcfc0b-f71c-4333-84ee-2d5a85924a9a";
  const wf = await db.workflow.findUnique({
    where: { id: workflowId },
  });
  console.log("WORKFLOW NODES:");
  console.log(JSON.stringify(wf?.nodes, null, 2));

  const runs = await db.workflowRun.findMany({
    where: { workflowId },
    include: {
      nodeRuns: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  console.log("\nRUNS:");
  console.log(JSON.stringify(runs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
