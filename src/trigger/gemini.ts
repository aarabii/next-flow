import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

export interface GeminiPayload {
  nodeRunId: string;
  model: string;
  prompt?: string;
  systemPrompt?: string;
  images?: string[];
  video?: string;
  audio?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

async function fetchFileAsInlineData(url: string) {
  // Strip mock crop queries if any for fetching the source file
  const fetchUrl = url.split("?")[0];
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
  run: async (payload: GeminiPayload) => {
    const {
      nodeRunId,
      model,
      prompt,
      systemPrompt,
      images,
      video,
      audio,
      temperature,
      topP,
      maxTokens,
    } = payload;
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
      const apiKey =
        process.env.GEMINI_API_KEY || process.env.GEMINI_SECRET_KEY || "";
      if (!apiKey) {
        throw new Error(
          "GEMINI_API_KEY environment variable is not configured",
        );
      }

      const ai = new GoogleGenAI({ apiKey });

      // Map models to new recommended Gemini 3 models per gemini-api-dev skill
      let actualModel = "gemini-3-pro-preview";
      if (model.toLowerCase().includes("flash")) {
        actualModel = "gemini-2.5-flash-lite";
      }

      // Build contents array
      const contents: any[] = [];
      if (prompt && prompt.trim()) {
        contents.push(prompt);
      }

      // Fetch images and add as inlineData if multimodal
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

      // Fetch video and add as inlineData if present
      if (video) {
        try {
          const inlineData = await fetchFileAsInlineData(video);
          contents.push(inlineData);
        } catch (err) {
          console.error(`Failed to load video for Gemini: ${video}`, err);
        }
      }

      // Fetch audio and add as inlineData if present
      if (audio) {
        try {
          const inlineData = await fetchFileAsInlineData(audio);
          contents.push(inlineData);
        } catch (err) {
          console.error(`Failed to load audio for Gemini: ${audio}`, err);
        }
      }

      // Build config
      const config: any = {};
      if (systemPrompt && systemPrompt.trim()) {
        config.systemInstruction = systemPrompt;
      }
      if (temperature !== undefined) config.temperature = temperature;
      if (topP !== undefined) config.topP = topP;
      if (maxTokens !== undefined) config.maxOutputTokens = maxTokens;

      // Call Gemini API
      const response = await ai.models.generateContent({
        model: actualModel,
        contents,
        config,
      });

      const responseText = response.text || "No response received";

      // 3. Update status to SUCCESS
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      await db.nodeRun.update({
        where: { id: nodeRunId },
        data: {
          status: "SUCCESS",
          output: { response: responseText },
          completedAt: endTime,
          duration,
        },
      });

      return { response: responseText };
    } catch (error: any) {
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      await db.nodeRun.update({
        where: { id: nodeRunId },
        data: {
          status: "FAILED",
          error:
            error.message ||
            "An unknown error occurred during Gemini generation",
          completedAt: endTime,
          duration,
        },
      });

      throw error;
    }
  },
});
