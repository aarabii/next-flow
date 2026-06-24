import { NextResponse } from "next/server";
import { Transloadit } from "@transloadit/node";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);
    fs.writeFileSync(tempFilePath, buffer);

    const transloadit = new Transloadit({
      authKey: process.env.TRANSLOADIT_KEY || "",
      authSecret: process.env.TRANSLOADIT_SECRET || "",
    });

    const options = {
      files: {
        file: tempFilePath,
      },
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
    };

    const status = await transloadit.createAssembly(options);

    // Clean up temp file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (e) {
      console.error("Failed to delete temp file:", e);
    }

    const fileUrl = status.results?.store?.[0]?.ssl_url || status.uploads?.[0]?.ssl_url;

    if (!fileUrl) {
      return NextResponse.json({ error: "Failed to get upload URL from Transloadit", status }, { status: 500 });
    }

    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error("Transloadit upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
