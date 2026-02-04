import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

type GraphEdge = { source: string; target: string };
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Next.js 15+: params is now a Promise and must be awaited
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const depth = Math.max(1, Math.min(4, Number(searchParams.get("depth") ?? 1) || 1));

  const db = await getDb();

  try {
    const visited = new Set<string>();
    const edges: GraphEdge[] = [];
    const edgeSet = new Set<string>();

    let frontier = [id];
    visited.add(id);

    for (let d = 0; d < depth; d++) {
      const next: string[] = [];

      for (const id of frontier) {
        const ups = db.all(
          `SELECT e.src_unique_id as source, e.dst_unique_id as target
           FROM edge e
           WHERE e.src_unique_id = ?`,
          [id]
        ) as GraphEdge[];

        const downs = db.all(
          `SELECT e.src_unique_id as source, e.dst_unique_id as target
           FROM edge e
           WHERE e.dst_unique_id = ?`,
          [id]
        ) as GraphEdge[];

        for (const e of [...ups, ...downs]) {
          const key = `${e.source}->${e.target}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push(e);
          }

          if (!visited.has(e.source)) {
            visited.add(e.source);
            next.push(e.source);
          }
          if (!visited.has(e.target)) {
            visited.add(e.target);
            next.push(e.target);
          }
        }
      }

      frontier = next;
    }

    const ids = Array.from(visited);
    const nodes: any[] = [];

    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      const rows = db.all(
        `SELECT unique_id, name, schema_name, package_name, materialized, resource_type, tags_json
         FROM model
         WHERE unique_id IN (${placeholders})`,
        ids
      ) as RawModel[];

      for (const r of rows) {
        nodes.push({
          id: r.unique_id,
          label: r.name,
          schema: r.schema_name ?? "",
          package_name: r.package_name ?? "",
          materialization: r.materialized ?? "view",
          resource_type: r.resource_type ?? "model",
          tags: parseTags(r.tags_json),
        });
      }
    }

    // Immediate upstream/downstream for detail lists
    const upstreamRows = db.all(
      `SELECT m.unique_id, m.name, m.description, m.schema_name, m.package_name, m.materialized, m.resource_type, m.tags_json
       FROM edge e
       JOIN model m ON e.dst_unique_id = m.unique_id
       WHERE e.src_unique_id = ?`,
      [id]
    ) as RawModel[];

    const downstreamRows = db.all(
      `SELECT m.unique_id, m.name, m.description, m.schema_name, m.package_name, m.materialized, m.resource_type, m.tags_json
       FROM edge e
       JOIN model m ON e.src_unique_id = m.unique_id
       WHERE e.dst_unique_id = ?`,
      [id]
    ) as RawModel[];

    const toSummary = (r: RawModel) => ({
      unique_id: r.unique_id,
      name: r.name,
      description: undefined,
      schema: r.schema_name ?? "",
      package_name: r.package_name ?? "",
      materialization: (r.materialized ?? "view") as any,
      resource_type: (r.resource_type ?? "model") as any,
      tags: parseTags(r.tags_json),
    });

    return NextResponse.json({
      nodes,
      edges,
      upstream: upstreamRows.map(toSummary),
      downstream: downstreamRows.map(toSummary),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
