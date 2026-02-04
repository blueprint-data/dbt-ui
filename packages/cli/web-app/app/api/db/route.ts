import { NextResponse } from "next/server";
import { openDb, getDbPath } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { db, dbPath } = await openDb();

    try {
      const row = db.get("SELECT 1 as ok") as { ok?: number };
      return NextResponse.json({ ok: row?.ok === 1, dbPath });
    } finally {
      db.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
