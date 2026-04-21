import { NextResponse } from "next/server";
import { buildFromManifestPayload } from "@dbt-ui/core";
import { API_KEY_HEADER, isManifestRefreshAuthorized, readManifestRefreshApiKey } from "@/lib/server/auth";
import { getDbPath, openDb } from "@/lib/server/db";

export const runtime = "nodejs";

type ManifestLike = {
  nodes?: unknown;
  sources?: unknown;
};

let refreshInProgress = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateManifestPayload(value: unknown): value is ManifestLike {
  if (!isRecord(value)) {
    return false;
  }

  const nodes = value.nodes;
  const sources = value.sources;

  return isRecord(nodes) && isRecord(sources);
}

export async function POST(request: Request) {
  const configuredApiKey = readManifestRefreshApiKey();
  if (!configuredApiKey) {
    return NextResponse.json(
      { ok: false, error: "Manifest refresh endpoint is not configured." },
      { status: 503 },
    );
  }

  if (!isManifestRefreshAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unauthorized. Provide a valid ${API_KEY_HEADER} header.`,
      },
      { status: 401 },
    );
  }

  if (refreshInProgress) {
    return NextResponse.json(
      { ok: false, error: "A manifest refresh is already in progress." },
      { status: 409 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  if (!validateManifestPayload(payload)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid manifest payload. Expected object with nodes and sources objects.",
      },
      { status: 400 },
    );
  }

  refreshInProgress = true;

  const dbPath = getDbPath();
  const startedAt = Date.now();

  try {
    await buildFromManifestPayload(payload, dbPath);

    const { db } = await openDb();
    try {
      const tables = {
        model: (db.get("SELECT COUNT(*) AS count FROM model") as { count?: number }).count ?? 0,
        column_def: (db.get("SELECT COUNT(*) AS count FROM column_def") as { count?: number }).count ?? 0,
        edge: (db.get("SELECT COUNT(*) AS count FROM edge") as { count?: number }).count ?? 0,
        search_docs: (db.get("SELECT COUNT(*) AS count FROM search_docs") as { count?: number }).count ?? 0,
      };

      return NextResponse.json({
        ok: true,
        dbPath,
        durationMs: Date.now() - startedAt,
        tables,
      });
    } finally {
      db.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Failed to refresh database from manifest: ${message}` },
      { status: 500 },
    );
  } finally {
    refreshInProgress = false;
  }
}
