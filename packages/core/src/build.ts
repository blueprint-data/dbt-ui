import fs from "node:fs";
import path from "node:path";
import { createDb, saveDb, initSchema, resetData, type Db } from "./sqlite";
import type { Manifest, DbtNode } from "./manifest";

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

function pickPath(node: DbtNode): string | null {
    return (
        (typeof node.original_file_path === "string" && node.original_file_path) ||
        (typeof node.path === "string" && node.path) ||
        null
    );
}

function pickMaterialized(node: DbtNode): string | null {
    const config = node.config as Record<string, unknown> | undefined;
    const m = config?.materialized;
    return typeof m === "string" ? m : null;
}

function pickSqlText(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null;
}

function pickRawCode(node: DbtNode): string | null {
    return pickSqlText(node.raw_code) ?? pickSqlText(node.raw_sql);
}

function pickCompiledCode(node: DbtNode): string | null {
    return pickSqlText(node.compiled_code) ?? pickSqlText(node.compiled_sql);
}

function insertModels(db: Db, nodes: DbtNode[]) {
    const rows = nodes.map((n) => [
        n.unique_id,
        n.name,
        n.resource_type,
        n.package_name ?? null,
        pickPath(n),
        n.database ?? null,
        n.schema ?? null,
        n.alias ?? null,
        pickMaterialized(n),
        n.description ?? null,
        safeJson(normalizeTags(n.tags)),
        safeJson(n.meta),
        safeJson(n.config),
        pickRawCode(n),
        pickCompiledCode(n),
    ]);

    db.transaction(() => {
        for (const r of rows) {
            db.run(
                `INSERT INTO model (
                    unique_id, name, resource_type, package_name, path, database_name, schema_name,
                    alias, materialized, description, tags_json, meta_json, config_json, raw_code, compiled_code
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                r
            );
        }
    });
}

function insertColumns(db: Db, nodes: DbtNode[]) {
    const rows: any[] = [];
    for (const n of nodes) {
        const cols = n.columns ?? {};
        for (const [colName, colDef] of Object.entries(cols)) {
            rows.push([
                n.unique_id,
                colName,
                colDef?.description ?? null,
                safeJson(colDef?.meta),
            ]);
        }
    }

    db.transaction(() => {
        for (const r of rows) {
            db.run(
                `INSERT INTO column_def (model_unique_id, name, description, meta_json) VALUES (?, ?, ?, ?)`,
                r
            );
        }
    });
}

function insertEdges(db: Db, nodes: DbtNode[]) {
    const rows: any[] = [];
    for (const n of nodes) {
        const deps: unknown = n.depends_on?.nodes;
        const depNodes = Array.isArray(deps) ? (deps.filter((x) => typeof x === "string") as string[]) : [];
        for (const dst of depNodes) {
            rows.push([n.unique_id, dst, "depends_on"]);
        }
    }

    db.transaction(() => {
        for (const r of rows) {
            db.run(
                `INSERT OR IGNORE INTO edge (src_unique_id, dst_unique_id, edge_type) VALUES (?, ?, ?)`,
                r
            );
        }
    });
}

function populateSearchDocs(db: Db, nodes: DbtNode[]) {
    const rows: any[] = [];

    for (const n of nodes) {
        const tagsArr = normalizeTags(n.tags);
        const tags = tagsArr.join(" ");

        rows.push([
            "model",
            n.unique_id,
            n.unique_id,
            n.name ?? "",
            n.description ?? "",
            tags,
            n.schema ?? "",
            n.package_name ?? "",
            pickPath(n) ?? "",
        ]);

        const cols = n.columns ?? {};
        for (const [colName, colDef] of Object.entries(cols)) {
            rows.push([
                "column",
                `${n.unique_id}::${colName}`,
                n.unique_id,
                colName,
                colDef?.description ?? "",
                tags,
                n.schema ?? "",
                n.package_name ?? "",
                pickPath(n) ?? "",
            ]);
        }
    }

    db.transaction(() => {
        for (const r of rows) {
            db.run(
                `INSERT INTO search_docs (
                    doc_type, doc_id, model_unique_id, name, description, tags, schema_name, package_name, path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                r
            );
        }
    });
}

export async function buildFromManifest(manifestPath: string, sqlitePath: string) {
    const resolvedManifest = path.resolve(manifestPath);
    if (!fs.existsSync(resolvedManifest)) {
        throw new Error(`manifest.json no existe: ${resolvedManifest}`);
    }

    const manifest = JSON.parse(fs.readFileSync(resolvedManifest, "utf-8")) as Manifest;
    const nodes = Object.values(manifest.nodes ?? {}) as DbtNode[];
    const models = nodes.filter((n) => n && n.resource_type === "model" && typeof n.unique_id === "string");

    const db = await createDb();
    try {
        initSchema(db);
        resetData(db);

        insertModels(db, models);
        insertColumns(db, models);
        insertEdges(db, models);
        populateSearchDocs(db, models);

        await saveDb(db, sqlitePath);
    } finally {
        db.close();
    }
}
