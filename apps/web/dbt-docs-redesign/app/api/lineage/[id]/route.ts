import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const db = getDb();

  try {
    const upstream = db
      .prepare(
        `
      SELECT m.unique_id, m.name
      FROM edge e
      JOIN model m ON e.dst_unique_id = m.unique_id
      WHERE e.src_unique_id = ?
    `
      )
      .all(params.id) as Array<{ unique_id: string; name: string }>;

    const downstream = db
      .prepare(
        `
      SELECT m.unique_id, m.name
      FROM edge e
      JOIN model m ON e.src_unique_id = m.unique_id
      WHERE e.dst_unique_id = ?
    `
      )
      .all(params.id) as Array<{ unique_id: string; name: string }>;

    return NextResponse.json({ upstream, downstream });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    db.close();
  }
}
