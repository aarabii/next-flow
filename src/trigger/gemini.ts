import { task } from "@trigger.dev/sdk";
import { db } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import { validateExternalUrl } from "@/lib/validation";

export interface GeminiPayload {
  nodeRunId: string;
  model: string;
  nodeType?: string;
  prompt?: string;
  systemPrompt?: string;
  images?: string[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  topK?: number;
  reasoning?: string;
}

async function fetchFileAsInlineData(url: string) {
  const fetchUrl = validateExternalUrl(url);
  const resp = await fetch(fetchUrl);
  if (!resp.ok) throw new Error(`Failed to fetch file: ${fetchUrl}`);
  const arrayBuffer = await resp.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType =
    resp.headers.get("content-type") || "application/octet-stream";
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

export const geminiTask = task({
  id: "gemini-execution",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: GeminiPayload, { ctx }) => {
    const {
      nodeRunId,
      model,
      prompt,
      systemPrompt,
      images,
      temperature,
      topP,
      maxTokens,
      topK,
      reasoning,
    } = payload;
    const startTime = new Date();

    await db.nodeRun.update({
      where: { id: nodeRunId },
      data: {
        status: "RUNNING",
        startedAt: startTime,
      },
    });

    try {
      const apiKey =
        process.env.GEMINI_API_KEY || process.env.GEMINI_SECRET_KEY || "";
      if (!apiKey) {
        throw new Error(
          "GEMINI_API_KEY environment variable is not configured",
        );
      }

      const ai = new GoogleGenAI({ apiKey });

      const actualModel = model || "gemini-2.5-flash-lite";

      const contents: (
        | string
        | { inlineData: { data: string; mimeType: string } }
      )[] = [];
      if (prompt && prompt.trim()) {
        contents.push(prompt);
      }

      if (images && images.length > 0) {
        for (const imgUrl of images) {
          if (imgUrl) {
            try {
              const inlineData = await fetchFileAsInlineData(imgUrl);
              contents.push(inlineData);
            } catch (err) {
              console.error(
                `Failed to load image for Gemini vision: ${imgUrl}`,
                err,
              );
            }
          }
        }
      }

      const config: {
        systemInstruction?: string;
        temperature?: number;
        topP?: number;
        maxOutputTokens?: number;
        topK?: number;
        thinkingConfig?: { thinkingBudget?: number };
      } = {};
      if (systemPrompt && systemPrompt.trim()) {
        config.systemInstruction = systemPrompt;
      }
      if (temperature !== undefined) config.temperature = temperature;
      if (topP !== undefined) config.topP = topP;
      if (maxTokens !== undefined) config.maxOutputTokens = maxTokens;
      if (topK !== undefined) config.topK = topK;
      if (reasoning && reasoning !== "Auto") {
        let budget = 1024;
        if (reasoning === "Medium") budget = 4096;
        if (reasoning === "High") budget = 8192;
        config.thinkingConfig = { thinkingBudget: budget };
      }

      const response = await ai.models.generateContent({
        model: actualModel,
        contents,
        config,
      });

      const responseText = response.text || "No response received";
      const outputResponse = responseText;

      const usageMetadata = response.usageMetadata;
      const usage = usageMetadata
        ? {
            prompt_tokens: usageMetadata.promptTokenCount,
            completion_tokens: usageMetadata.candidatesTokenCount,
            total_tokens: usageMetadata.totalTokenCount,
          }
        : undefined;

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      await db.nodeRun.update({
        where: { id: nodeRunId },
        data: {
          status: "SUCCESS",
          output: {
            response: outputResponse,
            usage,
          },
          completedAt: endTime,
          duration,
        },
      });

      return { response: outputResponse };
    } catch (error) {
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred during Gemini generation";

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
