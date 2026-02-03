import "server-only";
import path from "node:path";
import { openDb as openCoreDb, type Db } from "@dbt-ui/core";

const DEFAULT_DB_PATH = "target/dbt_ui.sqlite";

export function getDbPath(): string {
  const envPath = process.env.DBT_UI_DB_PATH;
  return envPath ? path.resolve(envPath) : path.resolve(process.cwd(), DEFAULT_DB_PATH);
}

export function openDb(): { db: Db; dbPath: string } {
  const dbPath = getDbPath();
  const db = openCoreDb(dbPath);
  return { db, dbPath };
}

export function getDb(): Db {
  return openCoreDb(getDbPath());
}

export function select1() {
  const { db } = openDb();
  try {
    const row = db.prepare("SELECT 1 as ok").get();
    return row as { ok: number };
  } finally {
    db.close();
  }
}
