import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const db = await getDb();

  try {
    const searchTerm = `%${q.toLowerCase()}%`;
    const results = db.all(
      `SELECT
        doc_type,
        doc_id,
        model_unique_id,
        name,
        description
      FROM search_docs
      WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?
      LIMIT 50`,
      [searchTerm, searchTerm, searchTerm]
    ) as Array<{
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
  }
}
