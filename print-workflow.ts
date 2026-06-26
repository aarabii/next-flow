import { db } from "./src/lib/prisma";

async function main() {
  const workflowId = "8f359632-8290-4a0d-85e4-a28a084c825b";
  const wf = await db.workflow.findUnique({
    where: { id: workflowId },
  });
  console.log("WORKFLOW:");
  console.log(JSON.stringify(wf, null, 2));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());





