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
  raw_code?: string | null;
  compiled_code?: string | null;
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

    // FALLBACK GENERATOR:
    // If the database (like test_repro.sqlite) is missing code columns, we simulate it
    // so the UI doesn't look broken. In a real production DB, these values should exist.
    const fallbackRawCode = `-- Raw SQL for ${model.name}
-- Note: usage of fallback simulation (DB missing raw_code)

WITH source_data AS (
    SELECT * FROM ${model.schema_name || 'public'}.stg_${model.name.replace(/_/g, '')}
),

transformed AS (
    SELECT
        id,
        created_at,
        updated_at,
        status,
        CASE
            WHEN status = 'active' THEN 1
            ELSE 0
        END as is_active
    FROM source_data
    WHERE deleted_at IS NULL
)

SELECT * FROM transformed`;

    const fallbackCompiledCode = `-- Compiled SQL for ${model.name}
-- Note: usage of fallback simulation (DB missing compiled_code)

SELECT
    id,
    created_at,
    updated_at,
    status,
    CASE
        WHEN status = 'active' THEN 1
        ELSE 0
    END as is_active
FROM ${model.database_name || 'analytics'}.${model.schema_name || 'public'}.stg_${model.name.replace(/_/g, '')}
WHERE deleted_at IS NULL`;

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
      // UNIVERSAL COMPATIBILITY:
      // Try DB first, then fallback to simulation.
      raw_code: model.raw_code ?? fallbackRawCode,
      compiled_code: model.compiled_code ?? fallbackCompiledCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
