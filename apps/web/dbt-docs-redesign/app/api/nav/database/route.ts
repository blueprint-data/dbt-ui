import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();

  try {
    const rows = db
      .prepare(
        `
      SELECT database_name, schema_name, unique_id, name
      FROM model
      ORDER BY database_name, schema_name, name
    `
      )
      .all() as Array<{ database_name?: string | null; schema_name?: string | null; unique_id: string; name: string }>;

    const tree: Record<string, Record<string, Array<{ unique_id: string; name: string }>>> = {};

    for (const r of rows) {
      const dbName = r.database_name ?? "default";
      const schema = r.schema_name ?? "public";

      tree[dbName] ??= {};
      tree[dbName][schema] ??= [];

      tree[dbName][schema].push({
        unique_id: r.unique_id,
        name: r.name,
      });
    }

    const result = Object.entries(tree).map(([dbName, schemas]) => ({
      name: dbName,
      schemas: Object.entries(schemas).map(([schemaName, models]) => ({
        name: schemaName,
        models,
      })),
    }));

    return NextResponse.json({ databases: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    db.close();
  }
}
