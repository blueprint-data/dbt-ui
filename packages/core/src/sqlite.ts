import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "node:fs";
import path from "node:path";

let sqlPromise: Promise<initSqlJs.SqlJsStatic> | null = null;

function findWasmFile(file: string): string {
  // With Turbopack, require.resolve() returns virtual paths like [project]/...
  // So we need to search for the WASM file dynamically in the filesystem
  
  const cwd = process.cwd();
  const searchPaths: string[] = [];
  
  // Strategy 1: Try workspace root first (where sql.js is actually installed in this project)
  const rootPnpmDir = path.join(cwd, '../../../node_modules/.pnpm');
  searchPaths.push(`root pnpm: ${rootPnpmDir}`);
  if (fs.existsSync(rootPnpmDir)) {
    try {
      const sqlJsDirs = fs.readdirSync(rootPnpmDir).filter(dir => dir.startsWith('sql.js@'));
      if (sqlJsDirs.length > 0) {
        const wasmPath = path.join(rootPnpmDir, sqlJsDirs[0], 'node_modules/sql.js/dist', file);
        if (fs.existsSync(wasmPath)) {
          console.log('[sql.js] ✅ WASM file found at:', wasmPath);
          return wasmPath;
        }
      }
    } catch (err) {
      // Continue to next strategy
    }
  }
  
  // Strategy 2: Try local pnpm structure
  const pnpmDir = path.join(cwd, 'node_modules/.pnpm');
  searchPaths.push(`local pnpm: ${pnpmDir}`);
  if (fs.existsSync(pnpmDir)) {
    try {
      const sqlJsDirs = fs.readdirSync(pnpmDir).filter(dir => dir.startsWith('sql.js@'));
      if (sqlJsDirs.length > 0) {
        const wasmPath = path.join(pnpmDir, sqlJsDirs[0], 'node_modules/sql.js/dist', file);
        if (fs.existsSync(wasmPath)) {
          console.log('[sql.js] ✅ WASM file found at:', wasmPath);
          return wasmPath;
        }
      }
    } catch (err) {
      // Continue to next strategy
    }
  }
  
  // Strategy 3: Try regular node_modules (npm/yarn)
  const regularPath = path.join(cwd, 'node_modules/sql.js/dist', file);
  searchPaths.push(`regular: ${regularPath}`);
  if (fs.existsSync(regularPath)) {
    console.log('[sql.js] ✅ WASM file found at:', regularPath);
    return regularPath;
  }
  
  // Strategy 4: Try root regular node_modules
  const rootRegularPath = path.join(cwd, '../../../node_modules/sql.js/dist', file);
  searchPaths.push(`root regular: ${rootRegularPath}`);
  if (fs.existsSync(rootRegularPath)) {
    console.log('[sql.js] ✅ WASM file found at:', rootRegularPath);
    return rootRegularPath;
  }
  
  const errorMsg = `[sql.js] ❌ Could not locate ${file}.\nCWD: ${cwd}\nSearched:\n${searchPaths.map(p => `  - ${p}`).join('\n')}`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

async function getSql(): Promise<initSqlJs.SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (file) => {
        // Browser: use public path
        if (typeof window !== 'undefined') {
          return `/${file}`;
        }
        
        // Node.js: search filesystem
        try {
          return findWasmFile(file);
        } catch (error) {
          console.error('[sql.js] Error in locateFile:', error);
          throw error;
        }
      }
    });
  }
  return sqlPromise;
}

export interface Db {
  exec(sql: string): void;
  run(sql: string, params?: any[]): void;
  all(sql: string, params?: any[]): any[];
  get(sql: string, params?: any[]): any | undefined;
  transaction<T>(fn: () => T): T;
  close(): void;
  _db: SqlJsDatabase;
}

function wrapDb(db: SqlJsDatabase): Db {
  return {
    exec(sql: string) {
      db.run(sql);
    },
    run(sql: string, params: any[] = []) {
      db.run(sql, params);
    },
    all(sql: string, params: any[] = []) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
    get(sql: string, params: any[] = []) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      let result: any | undefined;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    },
    transaction<T>(fn: () => T): T {
      try {
        db.run("BEGIN");
        const result = fn();
        db.run("COMMIT");
        return result;
      } catch (err) {
        db.run("ROLLBACK");
        throw err;
      }
    },
    close() {
      db.close();
    },
    _db: db,
  };
}

export async function createDb(): Promise<Db> {
  const SQL = await getSql();
  const db = new SQL.Database();
  return wrapDb(db);
}

export async function openDb(sqlitePath: string): Promise<Db> {
  const SQL = await getSql();
  const data = fs.readFileSync(sqlitePath);
  const db = new SQL.Database(data);
  return wrapDb(db);
}

export async function saveDb(db: Db, sqlitePath: string): Promise<void> {
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const data = db._db.export();
  fs.writeFileSync(sqlitePath, Buffer.from(data));
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

    CREATE TABLE IF NOT EXISTS search_docs (
      doc_type TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      model_unique_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      schema_name TEXT,
      package_name TEXT,
      path TEXT,
      PRIMARY KEY (doc_type, doc_id)
    );

    CREATE INDEX IF NOT EXISTS idx_column_model ON column_def(model_unique_id);
    CREATE INDEX IF NOT EXISTS idx_edge_src ON edge(src_unique_id);
    CREATE INDEX IF NOT EXISTS idx_edge_dst ON edge(dst_unique_id);
    CREATE INDEX IF NOT EXISTS idx_search_name ON search_docs(name);
    CREATE INDEX IF NOT EXISTS idx_search_schema ON search_docs(schema_name);
    CREATE INDEX IF NOT EXISTS idx_search_package ON search_docs(package_name);
    CREATE INDEX IF NOT EXISTS idx_search_tags ON search_docs(tags);
  `);
}

export function resetData(db: Db) {
  db.exec(`
    DELETE FROM search_docs;
    DELETE FROM edge;
    DELETE FROM column_def;
    DELETE FROM model;
  `);
}
