import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Db = Database.Database;

export function openDb(sqlitePath: string): Db {
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new Database(sqlitePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function initSchema(db: Db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS model (
      unique_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      package_name TEXT,
      path TEXT,
      database_name TEXT,
      schema_name TEXT,
      alias TEXT,
      materialized TEXT,
      description TEXT,
      tags_json TEXT,
      meta_json TEXT,
      config_json TEXT
    );

    CREATE TABLE IF NOT EXISTS column_def (
      model_unique_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      meta_json TEXT,
      PRIMARY KEY (model_unique_id, name),
      FOREIGN KEY (model_unique_id) REFERENCES model(unique_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS edge (
      src_unique_id TEXT NOT NULL,
      dst_unique_id TEXT NOT NULL,
      edge_type TEXT NOT NULL DEFAULT 'depends_on',
      PRIMARY KEY (src_unique_id, dst_unique_id, edge_type)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
      doc_type,
      doc_id,
      model_unique_id,
      name,
      description,
      tags,
      schema_name,
      package_name,
      path,
      tokenize='porter'
    );

    CREATE INDEX IF NOT EXISTS idx_column_model ON column_def(model_unique_id);
    CREATE INDEX IF NOT EXISTS idx_edge_src ON edge(src_unique_id);
    CREATE INDEX IF NOT EXISTS idx_edge_dst ON edge(dst_unique_id);
  `);
}

export function resetData(db: Db) {
  db.exec(`
    DELETE FROM search_fts;
    DELETE FROM edge;
    DELETE FROM column_def;
    DELETE FROM model;
  `);
}
