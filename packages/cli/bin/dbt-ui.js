#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

// Load version from package.json
const pkgPath = path.resolve(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const VERSION = pkg.version;

function getArgValue(flag, defaultValue) {
    const index = args.indexOf(flag);
    if (index !== -1 && args[index + 1]) {
        return args[index + 1];
    }
    return defaultValue;
}

function printUsage() {
    console.log(`
dbt-ui v${VERSION} - Modern documentation viewer for dbt projects

Usage:
  dbt-ui generate [options]    Generate SQLite database from manifest
  dbt-ui serve [options]       Start the documentation server
  dbt-ui --version             Show version number

Generate Options:
  --manifest <path>    Path to manifest.json (default: target/manifest.json)
  --out <path>         Output SQLite file path (default: target/dbt_ui.sqlite)

Serve Options:
  --db <path>          Path to SQLite database (default: target/dbt_ui.sqlite)
  --port <port>        Port to run server on (default: 3000)

Examples:
  # Step 1: Generate the database from your dbt manifest
  dbt-ui generate

  # Step 2: Start the documentation server  
  dbt-ui serve

  # Or with custom paths:
  dbt-ui generate --manifest ./target/manifest.json --out ./docs.sqlite
  dbt-ui serve --db ./docs.sqlite --port 8080
`);
}

async function generate() {
    const manifestPath = getArgValue("--manifest", "target/manifest.json");
    const outputPath = getArgValue("--out", "target/dbt_ui.sqlite");

    const absManifest = path.resolve(manifestPath);
    const absOutput = path.resolve(outputPath);

    console.log("\n============================================================");
    console.log("📦 dbt-ui generate");
    console.log("============================================================\n");

    // Check if manifest exists
    if (!fs.existsSync(absManifest)) {
        throw new CliError(
           `Manifest not found: ${absManifest}`,
           `Make sure you run this command from your dbt project root.\nIf your manifest is in a different location, use:\n  dbt-ui generate --manifest <path-to-manifest.json>\nTo generate the manifest, run:\n  dbt docs generate`
        );
    }

    console.log(`📄 Manifest: ${absManifest}`);
    console.log(`📂 Output:   ${absOutput}`);
    console.log("");

    try {
        // Import and use the build function dynamically
        const { buildFromManifest } = await import("../src/build.js");

        console.log("🔧 Processing manifest...");
        await buildFromManifest(absManifest, absOutput);

        console.log("\n✅ Database generated successfully!");
        console.log(`\nTo start the documentation server, run:`);
        console.log(`  dbt-ui serve`);
        console.log("");
    } catch (error) {
        // If the import fails (e.g., in npm package without src), use inline generator
        console.log("🔧 Processing manifest (inline mode)...");
        await generateInline(absManifest, absOutput);
    }
}

// Inline generator for when running from npm package
async function generateInline(manifestPath, outputPath) {
    // Dynamic import of sql.js
    const initSqlJs = (await import("sql.js")).default;

    // Initialize SQL.js
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // Create schema
    db.run(`
        CREATE TABLE IF NOT EXISTS model (
            unique_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            resource_type TEXT,
            package_name TEXT,
            path TEXT,
            database_name TEXT,
            schema_name TEXT,
            alias TEXT,
            materialized TEXT,
            description TEXT,
            tags_json TEXT,
            meta_json TEXT,
            config_json TEXT,
            raw_code TEXT,
            compiled_code TEXT
        );
        
        CREATE TABLE IF NOT EXISTS column_def (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_unique_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            meta_json TEXT,
            FOREIGN KEY (model_unique_id) REFERENCES model(unique_id)
        );
        
        CREATE TABLE IF NOT EXISTS edge (
            src_unique_id TEXT NOT NULL,
            dst_unique_id TEXT NOT NULL,
            edge_type TEXT DEFAULT 'depends_on',
            PRIMARY KEY (src_unique_id, dst_unique_id),
            FOREIGN KEY (src_unique_id) REFERENCES model(unique_id),
            FOREIGN KEY (dst_unique_id) REFERENCES model(unique_id)
        );
        
        CREATE TABLE IF NOT EXISTS search_docs (
            doc_type TEXT,
            doc_id TEXT PRIMARY KEY,
            model_unique_id TEXT,
            name TEXT,
            description TEXT,
            tags TEXT,
            schema_name TEXT,
            package_name TEXT,
            path TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_search_docs_name ON search_docs(name);
        CREATE INDEX IF NOT EXISTS idx_search_docs_model ON search_docs(model_unique_id);
    `);

    // Read manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const nodes = Object.values(manifest.nodes || {});
    const models = nodes.filter(n => n && n.resource_type === "model");

    console.log(`   Found ${models.length} models`);

    // Insert models
    for (const model of models) {
        const tags = Array.isArray(model.tags) ? JSON.stringify(model.tags) : null;
        db.run(
            `INSERT OR REPLACE INTO model (unique_id, name, resource_type, package_name, path, database_name, schema_name, alias, materialized, description, tags_json, meta_json, config_json, raw_code, compiled_code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                model.unique_id,
                model.name,
                model.resource_type,
                model.package_name || null,
                model.original_file_path || model.path || null,
                model.database || null,
                model.schema || null,
                model.alias || null,
                model.config?.materialized || null,
                model.description || null,
                tags,
                model.meta ? JSON.stringify(model.meta) : null,
                model.config ? JSON.stringify(model.config) : null,
                typeof model.raw_code === "string" && model.raw_code.length > 0
                    ? model.raw_code
                    : typeof model.raw_sql === "string" && model.raw_sql.length > 0
                        ? model.raw_sql
                        : null,
                typeof model.compiled_code === "string" && model.compiled_code.length > 0
                    ? model.compiled_code
                    : typeof model.compiled_sql === "string" && model.compiled_sql.length > 0
                        ? model.compiled_sql
                        : null,
            ]
        );

        // Insert columns
        const columns = model.columns || {};
        for (const [colName, colDef] of Object.entries(columns)) {
            db.run(
                `INSERT INTO column_def (model_unique_id, name, description, meta_json) VALUES (?, ?, ?, ?)`,
                [model.unique_id, colName, colDef?.description || null, colDef?.meta ? JSON.stringify(colDef.meta) : null]
            );
        }

        // Insert edges
        const deps = model.depends_on?.nodes || [];
        for (const dep of deps) {
            if (typeof dep === "string") {
                db.run(
                    `INSERT OR IGNORE INTO edge (src_unique_id, dst_unique_id, edge_type) VALUES (?, ?, ?)`,
                    [model.unique_id, dep, "depends_on"]
                );
            }
        }

        // Insert search docs
        db.run(
            `INSERT INTO search_docs (doc_type, doc_id, model_unique_id, name, description, tags, schema_name, package_name, path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                "model",
                model.unique_id,
                model.unique_id,
                model.name || "",
                model.description || "",
                (model.tags || []).join(" "),
                model.schema || "",
                model.package_name || "",
                model.original_file_path || model.path || "",
            ]
        );
    }

    // Export to file
    const data = db.export();
    const buffer = Buffer.from(data);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, buffer);
    db.close();

    console.log("\n✅ Database generated successfully!");
    console.log(`\nTo start the documentation server, run:`);
    console.log(`  dbt-ui serve`);
    console.log("");
}

function serve() {
    const port = getArgValue("--port", "3000");
    const dbPath = getArgValue("--db", "target/dbt_ui.sqlite");
    const absDb = path.resolve(dbPath);

    if (!fs.existsSync(absDb)) {
        throw new CliError(
            `SQLite not found: ${absDb}`,
            `To fix this, run 'dbt-ui generate' first.\nOr specify the database path: dbt-ui serve --db <path>`
        );
    }

    console.log("\n============================================================");
    console.log("🚀 dbt-ui is starting...");
    console.log("============================================================\n");
    console.log(`📂 Database: ${absDb}`);
    console.log(`🌐 URL:      http://localhost:${port}`);
    console.log("\nPress Ctrl+C to stop.");
    console.log("------------------------------------------------------------\n");

    const webAppDir = path.resolve(__dirname, "../web-app");

    if (!fs.existsSync(webAppDir)) {
        throw new CliError(
            `Web application not found at ${webAppDir}`,
            `Please reinstall dbt-ui:\n  npm install -g dbt-ui`
        );
    }

    const childEnv = {
        ...process.env,
        DBT_UI_DB_PATH: absDb,
        PORT: port,
        NODE_ENV: "production",
    };

    spawnSync("node", ["server.js"], {
        stdio: "inherit",
        env: childEnv,
        cwd: webAppDir,
    });
}

// Centralized Error Handling
class CliError extends Error {
    constructor(message, suggestion) {
        super(message);
        this.suggestion = suggestion;
        this.name = 'CliError';
    }
}

function handleError(err) {
    if (err instanceof CliError) {
        console.error(`\n❌ Error: ${err.message}`);
        if (err.suggestion) {
            console.error(`\n💡 Sugerencia:\n${err.suggestion}`);
        }
    } else {
        console.error(`\n❌ Unexpected Error: ${err.message}`);
        if (process.env.DEBUG) console.error(err.stack);
    }
    process.exit(1);
}

// Global Exception Catchers
process.on('unhandledRejection', (reason) => handleError(reason instanceof Error ? reason : new Error(String(reason))));
process.on('uncaughtException', handleError);

// Main Workflow Router
async function run() {
    if (command === "generate") {
        await generate();
    } else if (command === "serve") {
        serve();
    } else if (command === "--version" || command === "-v") {
        console.log(VERSION);
    } else if (command === "help" || command === "--help" || command === "-h") {
        printUsage();
    } else {
        printUsage();
    }
}

run().catch(handleError);
