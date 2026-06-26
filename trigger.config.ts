import { defineConfig } from "@trigger.dev/sdk/v3";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID || "proj_dqonbaecsgetevzjqbgv",
  runtime: "node",
  dirs: ["./src/trigger"],
  maxDuration: 3600, // 1 hour max duration
  build: {
    extensions: [
      prismaExtension({
        mode: "modern",
      }),
    ],
  },
});
