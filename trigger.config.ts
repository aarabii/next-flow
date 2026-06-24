import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "next-flow",
  runtime: "node",
  dirs: ["./src/trigger"],
  maxDuration: 3600, // 1 hour max duration
});
