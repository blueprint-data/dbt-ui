import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import type { ModelsResponse, ModelSummary, Materialization } from "@/lib/types";

export const runtime = "nodejs";

type RawModelRow = {
  unique_id: string;
  name: string;
  description?: string | null;
  schema_name?: string | null;
  package_name?: string | null;
  materialized?: string | null;
  resource_type?: string | null;
  tags_json?: string | null;
};

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const n = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function parseTags(tagsJson?: string | null): string[] {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed)
      ? parsed.filter((t) => typeof t === "string").map((t) => t.trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function buildFacets(db: any) {
  const schemas = db
    .all("SELECT DISTINCT schema_name FROM model WHERE schema_name IS NOT NULL AND schema_name != '' ORDER BY schema_name")
    .map((r: { schema_name: string }) => r.schema_name);

  const packages = db
    .all("SELECT DISTINCT package_name FROM model WHERE package_name IS NOT NULL AND package_name != '' ORDER BY package_name")
    .map((r: { package_name: string }) => r.package_name);

  const materializations = db
    .all("SELECT DISTINCT materialized FROM model WHERE materialized IS NOT NULL AND materialized != '' ORDER BY materialized")
    .map((r: { materialized: string }) => r.materialized as Materialization);

  const tagRows = db
    .all("SELECT tags_json FROM model WHERE tags_json IS NOT NULL") as { tags_json: string }[];

  const tagsSet = new Set<string>();
  for (const row of tagRows) {
    for (const tag of parseTags(row.tags_json)) {
      tagsSet.add(tag);
    }
  }

  const tags = Array.from(tagsSet).sort((a, b) => a.localeCompare(b));

  return { tags, schemas, packages, materializations } satisfies ModelsResponse["facets"];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = clampInt(url.searchParams.get("limit"), 20, 1, 200);
  const offset = clampInt(url.searchParams.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER);

  const db = await getDb();

  try {
    const totalRow = db.get("SELECT COUNT(*) AS total FROM model") as { total?: number };

    const rows = db.all(
      `SELECT unique_id, name, description, schema_name, package_name, materialized, resource_type, tags_json
       FROM model
       ORDER BY name
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as RawModelRow[];

    const items: ModelSummary[] = rows.map((row) => ({
      unique_id: row.unique_id,
      name: row.name,
      description: row.description ?? undefined,
      schema: row.schema_name ?? "",
      package_name: row.package_name ?? "",
      materialization: (row.materialized ?? "view") as Materialization,
      tags: parseTags(row.tags_json),
      resource_type: (row.resource_type ?? "model") as ModelSummary["resource_type"],
    }));

    const facets = buildFacets(db);

    const payload: ModelsResponse = {
      total: totalRow?.total ?? 0,
      items,
      facets,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
