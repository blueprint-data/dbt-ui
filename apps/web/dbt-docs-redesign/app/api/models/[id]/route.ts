import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const db = getDb();

  try {
    const model = db
      .prepare(
        `
      SELECT *
      FROM model
      WHERE unique_id = ?
    `
      )
      .get(params.id) as { tags_json?: string } | undefined;

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const columns = db
      .prepare(
        `
      SELECT name, description
      FROM column_def
      WHERE model_unique_id = ?
      ORDER BY name
    `
      )
      .all(params.id) as Array<{ name: string; description?: string | null }>;

    return NextResponse.json({
      ...model,
      tags: JSON.parse(model.tags_json ?? "[]"),
      columns,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    db.close();
  }
}
