import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/prisma";
import { Transloadit } from "@transloadit/node";

export interface CropImagePayload {
  nodeRunId: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

async function cropWithTransloadit(imageUrl: string, x: number, y: number, width: number, height: number): Promise<string> {
  const transloadit = new Transloadit({
    authKey: process.env.TRANSLOADIT_KEY || "",
    authSecret: process.env.TRANSLOADIT_SECRET || "",
  });

  const status = await transloadit.createAssembly({
    params: {
      steps: {
        import: {
          robot: "/http/import",
          url: imageUrl,
        },
        crop: {
          robot: "/image/resize",
          use: "import",
          crop: {
            x1: `${x}%`,
            y1: `${y}%`,
            x2: `${x + width}%`,
            y2: `${y + height}%`,
          },
          result: true,
        },
      },
    },
    waitForCompletion: true,
  });

  const url = status.results?.crop?.[0]?.ssl_url || status.uploads?.[0]?.ssl_url;
  if (!url) throw new Error("Transloadit failed to return URL for crop");
  return url;
}

export const cropImageTask = task({
  id: "crop-image",
  run: async (payload: CropImagePayload) => {
    const { nodeRunId, imageUrl, x, y, width, height } = payload;
    const startTime = new Date();

    // 1. Update status to RUNNING
    await db.nodeRun.update({
      where: { id: nodeRunId },
      data: {
        status: "RUNNING",
        startedAt: startTime,
      },
    });

    try {
      // 2. 30+ second artificial delay (Mandatory Po.md constraint)
      await new Promise((resolve) => setTimeout(resolve, 31000));

      if (!imageUrl) {
        throw new Error("No input image URL provided");
      }

      const outputImageUrl = await cropWithTransloadit(imageUrl, x, y, width, height);

      // 3. Update status to SUCCESS
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      await db.nodeRun.update({
        where: { id: nodeRunId },
        data: {
          status: "SUCCESS",
          output: { url: outputImageUrl },
          completedAt: endTime,
          duration,
        },
      });

      return { url: outputImageUrl };
    } catch (error: any) {
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      await db.nodeRun.update({
        where: { id: nodeRunId },
        data: {
          status: "FAILED",
          error: error.message || "An unknown error occurred during crop",
          completedAt: endTime,
          duration,
        },
      });

      throw error;
    }
  },
});
