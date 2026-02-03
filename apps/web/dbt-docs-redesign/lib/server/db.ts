import "server-only";
import path from "node:path";
import fs from "node:fs";
import { openDb as openCoreDb, type Db } from "@dbt-ui/core";

const DEFAULT_DB_PATH = "target/dbt_ui.sqlite";

let cachedDb: Db | null = null;
let cachedMtime: number | null = null;
let cachedPath: string | null = null;

export function getDbPath(): string {
  const envPath = process.env.DBT_UI_DB_PATH;
  return envPath ? path.resolve(envPath) : path.resolve(process.cwd(), DEFAULT_DB_PATH);
}

export async function getDb(): Promise<Db> {
  const dbPath = getDbPath();

  try {
    const stats = fs.statSync(dbPath);
    const mtime = stats.mtimeMs;

    if (cachedDb && cachedPath === dbPath && cachedMtime === mtime) {
      return cachedDb;
    }

    if (cachedDb) {
      cachedDb.close();
    }

    cachedDb = await openCoreDb(dbPath);
    cachedMtime = mtime;
    cachedPath = dbPath;

    return cachedDb;
  } catch (error) {
    throw new Error(`Failed to open database at ${dbPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function openDb(): Promise<{ db: Db; dbPath: string }> {
  const dbPath = getDbPath();
  const db = await openCoreDb(dbPath);
  return { db, dbPath };
}
