import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

type RawModel = {
  unique_id: string;
  name: string;
  resource_type?: string | null;
  package_name?: string | null;
  path?: string | null;
  database_name?: string | null;
  schema_name?: string | null;
  alias?: string | null;
  materialized?: string | null;
  description?: string | null;
  tags_json?: string | null;
  meta_json?: string | null;
  config_json?: string | null;
};

function parseJson(json: string | null | undefined, defaultValue: any = null): any {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Next.js 15+: params is now a Promise and must be awaited
  const { id } = await params;
  const db = await getDb();

  try {
    const model = db.get(
      `SELECT *
       FROM model
       WHERE unique_id = ?`,
      [id]
    ) as RawModel | undefined;

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const columns = db.all(
      `SELECT name, description
       FROM column_def
       WHERE model_unique_id = ?
       ORDER BY name`,
      [id]
    ) as Array<{ name: string; description?: string | null }>;

    // Parse JSON fields and map to ModelDetail interface
    return NextResponse.json({
      unique_id: model.unique_id,
      name: model.name,
      schema: model.schema_name ?? "",
      database: model.database_name ?? "",
      path: model.path ?? "",
      package_name: model.package_name ?? "",
      materialization: (model.materialized ?? "view") as any,
      resource_type: (model.resource_type ?? "model") as any,
      description: model.description ?? "",
      tags: parseJson(model.tags_json, []),
      meta: parseJson(model.meta_json, {}),
      columns: columns.map(col => ({
        name: col.name,
        description: col.description ?? undefined,
      })),
      raw_code: undefined, // TODO: Add if available in DB
      compiled_code: undefined, // TODO: Add if available in DB
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
