import fs from "node:fs";
import path from "node:path";
import { openDb, initSchema, resetData, type Db } from "./sqlite.js";
import type { Manifest, DbtNode } from "./manifest.js";

function safeJson(value: unknown): string | null {
    if (value === undefined) return null;
    try {
        return JSON.stringify(value);
    } catch {
        return null;
    }
}

function normalizeTags(tags: unknown): string[] {
    if (!Array.isArray(tags)) return [];
    return tags.filter((t) => typeof t === "string") as string[];
}

function pickPath(node: any): string | null {
    return (
        (typeof node.original_file_path === "string" && node.original_file_path) ||
        (typeof node.path === "string" && node.path) ||
        null
    );
}

function pickMaterialized(node: any): string | null {
    // dbt suele guardar esto en config.materialized
    const m = node?.config?.materialized;
    return typeof m === "string" ? m : null;
}

function insertModels(db: Db, nodes: DbtNode[]) {
    const stmt = db.prepare(`
    INSERT INTO model (
      unique_id, name, resource_type, package_name, path, database_name, schema_name,
      alias, materialized, description, tags_json, meta_json, config_json
    )
    VALUES (
      @unique_id, @name, @resource_type, @package_name, @path, @database_name, @schema_name,
      @alias, @materialized, @description, @tags_json, @meta_json, @config_json
    )
  `);

    const tx = db.transaction((rows: any[]) => {
        for (const r of rows) stmt.run(r);
    });

    const rows = nodes.map((n) => ({
        unique_id: n.unique_id,
        name: n.name,
        resource_type: n.resource_type,
        package_name: n.package_name ?? null,
        path: pickPath(n),
        database_name: (n as any).database ?? null,
        schema_name: (n as any).schema ?? null,
        alias: (n as any).alias ?? null,
        materialized: pickMaterialized(n),
        description: (n as any).description ?? null,
        tags_json: safeJson(normalizeTags((n as any).tags)),
        meta_json: safeJson((n as any).meta),
        config_json: safeJson((n as any).config),
    }));

    tx(rows);
}

function insertColumns(db: Db, nodes: DbtNode[]) {
    const stmt = db.prepare(`
    INSERT INTO column_def (model_unique_id, name, description, meta_json)
    VALUES (@model_unique_id, @name, @description, @meta_json)
  `);

    const tx = db.transaction((rows: any[]) => {
        for (const r of rows) stmt.run(r);
    });

    const rows: any[] = [];
    for (const n of nodes) {
        const cols = n.columns ?? {};
        for (const [colName, colDef] of Object.entries(cols)) {
            rows.push({
                model_unique_id: n.unique_id,
                name: colName,
                description: colDef?.description ?? null,
                meta_json: safeJson(colDef?.meta),
            });
        }
    }

    tx(rows);
}

function insertEdges(db: Db, nodes: DbtNode[]) {
    const stmt = db.prepare(`
    INSERT OR IGNORE INTO edge (src_unique_id, dst_unique_id, edge_type)
    VALUES (@src, @dst, 'depends_on')
  `);

    const tx = db.transaction((rows: any[]) => {
        for (const r of rows) stmt.run(r);
    });

    const rows: any[] = [];
    for (const n of nodes) {
        const deps: unknown = n.depends_on?.nodes;
        const depNodes = Array.isArray(deps) ? (deps.filter((x) => typeof x === "string") as string[]) : [];
        for (const dst of depNodes) {
            rows.push({ src: n.unique_id, dst });
        }
    }

    tx(rows);
}

function populateFts(db: Db, nodes: DbtNode[]) {
    // Nota: FTS está "contentless", insertamos explícitamente textos.
    const stmt = db.prepare(`
    INSERT INTO search_fts (
      doc_type, doc_id, model_unique_id, name, description, tags, schema_name, package_name, path
    )
    VALUES (
      @doc_type, @doc_id, @model_unique_id, @name, @description, @tags, @schema_name, @package_name, @path
    )
  `);

    const tx = db.transaction((rows: any[]) => {
        for (const r of rows) stmt.run(r);
    });

    const rows: any[] = [];

    for (const n of nodes) {
        const tagsArr = normalizeTags((n as any).tags);
        const tags = tagsArr.join(" ");

        // Documento tipo "model"
        rows.push({
            doc_type: "model",
            doc_id: n.unique_id,
            model_unique_id: n.unique_id,
            name: n.name ?? "",
            description: (n as any).description ?? "",
            tags,
            schema_name: (n as any).schema ?? "",
            package_name: n.package_name ?? "",
            path: pickPath(n) ?? "",
        });

        // Documentos tipo "column" (uno por columna)
        const cols = n.columns ?? {};
        for (const [colName, colDef] of Object.entries(cols)) {
            rows.push({
                doc_type: "column",
                doc_id: `${n.unique_id}::${colName}`,
                model_unique_id: n.unique_id,
                name: colName,
                description: colDef?.description ?? "",
                tags,
                schema_name: (n as any).schema ?? "",
                package_name: n.package_name ?? "",
                path: pickPath(n) ?? "",
            });
        }
    }

    tx(rows);
}

export function buildFromManifest(manifestPath: string, sqlitePath: string) {
    const resolvedManifest = path.resolve(manifestPath);
    if (!fs.existsSync(resolvedManifest)) {
        throw new Error(`manifest.json no existe: ${resolvedManifest}`);
    }

    const manifest = JSON.parse(fs.readFileSync(resolvedManifest, "utf-8")) as Manifest;

    const nodes = Object.values(manifest.nodes ?? {}) as DbtNode[];


    const models = nodes.filter((n) => n && n.resource_type === "model" && typeof n.unique_id === "string");

    const db = openDb(sqlitePath);
    try {
        initSchema(db);
        resetData(db);

        insertModels(db, models);
        insertColumns(db, models);
        insertEdges(db, models);
        populateFts(db, models);
    } finally {
        db.close();
    }
}
