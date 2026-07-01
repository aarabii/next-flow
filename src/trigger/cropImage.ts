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

const R2_URL_PREFIX =
  "https://pub-9fa6062fc2e84197b79b0f5a74aafa86.r2.dev/";

function validateExternalUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`Only HTTPS URLs are allowed: ${rawUrl}`);
  }

  const hostname = parsed.hostname;
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^\[::1\]$/,
    /^\[fc/i,
    /^\[fd/i,
    /^\[fe80/i,
    /\.local$/i,
    /\.internal$/i,
    /\.localhost$/i,
  ];

  for (const pattern of privatePatterns) {
    if (pattern.test(hostname)) {
      throw new Error(`Private/internal URLs are not allowed: ${hostname}`);
    }
  }

  return rawUrl;
}

async function cropWithTransloadit(
  imageUrl: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<string> {
  const validatedUrl = validateExternalUrl(imageUrl);
  const transloadit = new Transloadit({
    authKey: process.env.TRANSLOADIT_KEY || "",
    authSecret: process.env.TRANSLOADIT_SECRET || "",
  });

  const status = await transloadit.createAssembly({
    params: {
      steps: {
        import: {
          robot: "/http/import",
          url: validatedUrl,
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
        store: {
          robot: "/cloudflare/store",
          use: "crop",
          credentials: "next-flow",
          path: "crops/${unique_prefix}/${file.url_name}",
          url_prefix: R2_URL_PREFIX,
          result: true,
        },
      },
    },
    waitForCompletion: true,
  });

  const url =
    status.results?.store?.[0]?.ssl_url ||
    status.results?.store?.[0]?.url ||
    status.results?.crop?.[0]?.ssl_url;
  if (!url) throw new Error("Transloadit failed to return URL for crop");
  return url;
}

export const cropImageTask = task({
  id: "crop-image",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: CropImagePayload, { ctx }) => {
    const { nodeRunId, imageUrl, x, y, width, height } = payload;
    const startTime = new Date();

    await db.nodeRun.update({
      where: { id: nodeRunId },
      data: {
        status: "RUNNING",
        startedAt: startTime,
      },
    });

    try {
      // 30s artificial delay
      await new Promise((resolve) => setTimeout(resolve, 31000));

      if (!imageUrl) {
        throw new Error("No input image URL provided");
      }

      const outputImageUrl = await cropWithTransloadit(
        imageUrl,
        x,
        y,
        width,
        height,
      );

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
    } catch (error) {
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred during crop";

      const isLastAttempt = ctx.attempt.number >= (ctx.run.maxAttempts || 3);

      if (isLastAttempt) {
        await db.nodeRun.update({
          where: { id: nodeRunId },
          data: {
            status: "FAILED",
            error: message,
            completedAt: endTime,
            duration,
          },
        });
      } else {
        await db.nodeRun.update({
          where: { id: nodeRunId },
          data: {
            error: `Attempt ${ctx.attempt.number} failed: ${message}. Retrying...`,
          },
        });
      }

      throw error;
    }
  },
});
