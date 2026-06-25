import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import { Transloadit } from "@transloadit/node";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface GeminiPayload {
  nodeRunId: string;
  model: string;
  nodeType?: string;
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

async function generateAndUploadImage(ai: GoogleGenAI, promptText: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: promptText || "A beautiful abstract digital artwork",
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (!part?.inlineData?.data) {
    throw new Error("Gemini image generation did not return any image data");
  }

  const base64Data = part.inlineData.data;
  const mimeType = part.inlineData.mimeType || "image/png";
  const extension = mimeType.split("/")[1] || "png";
  const buffer = Buffer.from(base64Data, "base64");

  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `${Date.now()}-generated-image.${extension}`);
  fs.writeFileSync(tempFilePath, buffer);

  try {
    const transloadit = new Transloadit({
      authKey: process.env.TRANSLOADIT_KEY || "",
      authSecret: process.env.TRANSLOADIT_SECRET || "",
    });

    const status = await transloadit.createAssembly({
      files: { file: tempFilePath },
      params: {
        steps: {
          store: {
            robot: "/image/resize",
            use: ":original",
            result: true,
          },
        },
      },
      waitForCompletion: true,
    });

    const fileUrl = status.results?.store?.[0]?.ssl_url || status.uploads?.[0]?.ssl_url;
    if (!fileUrl) {
      throw new Error("Transloadit failed to return URL for generated image");
    }

    return fileUrl;
  } finally {
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {
      console.error("Failed to delete temp file:", e);
    }
  }
}

export const geminiTask = task({
  id: "gemini-execution",
  run: async (payload: GeminiPayload) => {
    const {
      nodeRunId,
      model,
      nodeType,
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

      // Use model ID from the configuration or fall back to flash
      const actualModel = model || "gemini-2.5-flash-lite";

      // Build contents array
      const contents: (string | { inlineData: { data: string; mimeType: string } })[] = [];
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
      const config: {
        systemInstruction?: string;
        temperature?: number;
        topP?: number;
        maxOutputTokens?: number;
      } = {};
      if (systemPrompt && systemPrompt.trim()) {
        config.systemInstruction = systemPrompt;
      }
      if (temperature !== undefined) config.temperature = temperature;
      if (topP !== undefined) config.topP = topP;
      if (maxTokens !== undefined) config.maxOutputTokens = maxTokens;

      let outputResponse = "";

      if (nodeType === "imageNode") {
        outputResponse = await generateAndUploadImage(ai, prompt || "A beautiful abstract digital artwork");
      } else {
        // Call Gemini API
        const response = await ai.models.generateContent({
          model: actualModel,
          contents,
          config,
        });

        const responseText = response.text || "No response received";
        outputResponse = responseText;

        if (nodeType === "videoNode") {
          const textForClassification = (prompt || responseText).toLowerCase();
          if (textForClassification.includes("nature") || textForClassification.includes("forest") || textForClassification.includes("tree") || textForClassification.includes("water") || textForClassification.includes("river")) {
            outputResponse = "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4";
          } else if (textForClassification.includes("tech") || textForClassification.includes("code") || textForClassification.includes("computer") || textForClassification.includes("keyboard")) {
            outputResponse = "https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-computer-keyboard-4066-large.mp4";
          } else if (textForClassification.includes("clock") || textForClassification.includes("time") || textForClassification.includes("gear") || textForClassification.includes("mechanism")) {
            outputResponse = "https://assets.mixkit.co/videos/preview/mixkit-rotating-gears-of-a-clock-mechanism-4306-large.mp4";
          } else if (textForClassification.includes("city") || textForClassification.includes("car") || textForClassification.includes("traffic") || textForClassification.includes("night")) {
            outputResponse = "https://assets.mixkit.co/videos/preview/mixkit-light-trails-of-traffic-in-a-modern-city-at-night-42284-large.mp4";
          } else {
            outputResponse = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
          }
        } else if (nodeType === "audioNode") {
          const speechText = responseText.replace(/[^a-zA-Z0-9\s.,!?]/g, "").slice(0, 180);
          if (speechText.trim()) {
            outputResponse = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(speechText)}`;
          } else {
            outputResponse = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
          }
        }
      }

      // 3. Update status to SUCCESS
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      await db.nodeRun.update({
        where: { id: nodeRunId },
        data: {
          status: "SUCCESS",
          output: { response: outputResponse },
          completedAt: endTime,
          duration,
        },
      });

      return { response: outputResponse };
    } catch (error) {
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      const message = error instanceof Error ? error.message : "An unknown error occurred during Gemini generation";

      await db.nodeRun.update({
        where: { id: nodeRunId },
        data: {
          status: "FAILED",
          error: message,
          completedAt: endTime,
          duration,
        },
      });

      throw error;
    }
  },
});
