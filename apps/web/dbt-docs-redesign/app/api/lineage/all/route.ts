import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

type RawModel = {
  unique_id: string;
  name: string;
  schema_name?: string | null;
  package_name?: string | null;
  materialized?: string | null;
  resource_type?: string | null;
  tags_json?: string | null;
};

function parseTags(json?: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((t) => typeof t === "string").map((t) => t.trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

/**
 * Get complete project architecture - all nodes and edges
 * This endpoint is used for the global lineage graph view
 */
export async function GET() {
  const db = await getDb();

  try {
    // Get ALL models
    const modelRows = db.all(
      `SELECT unique_id, name, schema_name, package_name, materialized, resource_type, tags_json
       FROM model
       ORDER BY package_name, schema_name, name`
    ) as RawModel[];

    // Get ALL edges
    const edgeRows = db.all(
      `SELECT src_unique_id as source, dst_unique_id as target
       FROM edge`
    ) as Array<{ source: string; target: string }>;

    // Map models to graph nodes
    const nodes = modelRows.map((r) => ({
      id: r.unique_id,
      label: r.name,
      schema: r.schema_name ?? "",
      package_name: r.package_name ?? "",
      materialization: (r.materialized ?? "view") as any,
      resource_type: (r.resource_type ?? "model") as any,
      tags: parseTags(r.tags_json),
    }));

    // Map to ModelSummary format for compatibility
    const models = modelRows.map((r) => ({
      unique_id: r.unique_id,
      name: r.name,
      schema: r.schema_name ?? "",
      package_name: r.package_name ?? "",
      materialization: (r.materialized ?? "view") as any,
      resource_type: (r.resource_type ?? "model") as any,
      tags: parseTags(r.tags_json),
      description: undefined,
    }));

    return NextResponse.json({
      nodes,
      edges: edgeRows,
      models, // Full ModelSummary list for compatibility
      total: nodes.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
