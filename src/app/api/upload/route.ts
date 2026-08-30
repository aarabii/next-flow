import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { Transloadit } from "@transloadit/node";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { R2_URL_PREFIX } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

function buildSteps(fileType: string) {
  const isImage = fileType.startsWith("image/");
  const isAudio = fileType.startsWith("audio/");

  // Determine the R2 folder based on file type
  const folder = isAudio ? "audio" : isImage ? "uploads" : "files";

  if (isImage) {
    // Images: resize then store
    return {
      resize: {
        robot: "/image/resize",
        use: ":original",
        result: true,
      },
      store: {
        robot: "/cloudflare/store",
        use: "resize",
        credentials: "next-flow",
        path: `${folder}/\${unique_prefix}/\${file.url_name}`,
        url_prefix: R2_URL_PREFIX,
        result: true,
      },
    };
  }

  // Audio & other files: store directly without processing
  return {
    store: {
      robot: "/cloudflare/store",
      use: ":original",
      credentials: "next-flow",
      path: `${folder}/\${unique_prefix}/\${file.url_name}`,
      url_prefix: R2_URL_PREFIX,
      result: true,
    },
  };
}

export async function POST(req: Request) {
  let tempFilePath: string | null = null;

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAllowed = await limiter.check(20, `upload_${user.id}`);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many upload requests. Please wait a minute before uploading again." },
        { status: 429 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      "audio/aac",
      "audio/flac",
      "audio/mp4",
    ];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}. Only images and audio files are accepted.` },
        { status: 400 },
      );
    }

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 25MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB.` },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempDir = os.tmpdir();
    // Sanitize filename for local storage
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    tempFilePath = path.join(tempDir, `${Date.now()}-${sanitizedFileName}`);
    fs.writeFileSync(tempFilePath, buffer);

    const transloadit = new Transloadit({
      authKey: process.env.TRANSLOADIT_KEY || "",
      authSecret: process.env.TRANSLOADIT_SECRET || "",
    });

    const steps = buildSteps(file.type);

    const options = {
      files: {
        file: tempFilePath,
      },
      params: {
        steps,
      },
      waitForCompletion: true,
    };

    const status = await transloadit.createAssembly(
      options as Parameters<Transloadit["createAssembly"]>[0],
    );

    // Extract the R2 URL from whichever step produced the result
    const fileUrl =
      status.results?.store?.[0]?.ssl_url ||
      status.results?.store?.[0]?.url ||
      status.results?.resize?.[0]?.ssl_url ||
      status.uploads?.[0]?.ssl_url;

    if (!fileUrl) {
      return NextResponse.json(
        { error: "Failed to get upload URL from Transloadit", status },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Transloadit upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error("Failed to delete temp file:", e);
      }
    }
  }
}
