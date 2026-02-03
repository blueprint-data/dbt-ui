import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const db = getDb();

  try {
    const results = db
      .prepare(
        `
      SELECT
        doc_type,
        doc_id,
        model_unique_id,
        name,
        description
      FROM search_fts
      WHERE search_fts MATCH ?
      LIMIT 50
    `
      )
      .all(q) as Array<{
        doc_type: string;
        doc_id: string;
        model_unique_id: string;
        name: string;
        description?: string;
      }>;

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    db.close();
  }
}
