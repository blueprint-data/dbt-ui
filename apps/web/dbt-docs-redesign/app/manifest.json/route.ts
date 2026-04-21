import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { API_KEY_HEADER, isManifestServeAuthorized } from "@/lib/server/auth";
import { getManifestPath } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isManifestServeAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unauthorized. Provide a valid ${API_KEY_HEADER} header.`,
      },
      { status: 401 },
    );
  }

  const manifestPath = getManifestPath();

  let manifestJson: string;
  try {
    manifestJson = await fs.readFile(manifestPath, "utf-8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json(
        { ok: false, error: `Manifest file not found at ${manifestPath}.` },
        { status: 404 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Failed to read manifest file: ${message}` },
      { status: 500 },
    );
  }

  try {
    const payload = JSON.parse(manifestJson);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Invalid manifest JSON at ${manifestPath}: ${message}` },
      { status: 500 },
    );
  }
}
