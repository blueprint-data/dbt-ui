#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildFromManifest, openDb } from "@dbt-ui/core";

const args = process.argv.slice(2);
const command = args[0];

async function main() {
    if (command === "generate") {
        const skipDbt = args.includes("--skip-dbt");
        const manifestPath = getArgValue("--manifest") ?? "target/manifest.json";
        const sqlitePath = getArgValue("--out") ?? "target/dbt_ui.sqlite";

        if (!skipDbt) {
            console.log("Running 'dbt docs generate'...");
            try {
                execSync("dbt docs generate", { stdio: "inherit" });
            } catch (error) {
                console.error("Error: 'dbt docs generate' failed.");
                process.exit(1);
            }
        }

        if (!fs.existsSync(manifestPath)) {
            console.error(`Error: Manifest file not found at ${manifestPath}`);
            process.exit(1);
        }

        console.log(`Building SQLite at ${sqlitePath} from ${manifestPath}...`);
        try {
            buildFromManifest(manifestPath, sqlitePath);

            const db = openDb(sqlitePath);
            const counts = db.prepare(`
        SELECT 
          (SELECT count(*) FROM model) as models,
          (SELECT count(*) FROM column_def) as columns,
          (SELECT count(*) FROM edge) as edges,
          (SELECT count(*) FROM search_fts) as fts
      `).get() as { models: number; columns: number; edges: number; fts: number };
            db.close();

            console.log("SUCCESS: Database generated.");
            console.log(`- Models: ${counts.models}`);
            console.log(`- Columns: ${counts.columns}`);
            console.log(`- Edges: ${counts.edges}`);
            console.log(`- FTS entries: ${counts.fts}`);
        } catch (error) {
            console.error("Error during build:", error);
            process.exit(1);
        }
    } else if (command === "serve") {
        serve(process.argv.slice(3));
    } else {
        console.log("Usage: dbt-ui generate [--manifest <path>] [--out <path>] [--skip-dbt]");
        console.log("       dbt-ui serve [--db <path>] [--port <port>]");
    }
}

function getArgValue(flag: string): string | null {
    const index = args.indexOf(flag);
    if (index !== -1 && args[index + 1]) {
        return args[index + 1];
    }
    return null;
}

function serve(cmdArgs: string[]) {
    const portArgIndex = cmdArgs.indexOf("--port");
    const port = portArgIndex !== -1 ? cmdArgs[portArgIndex + 1] : "3000";

    const dbArgIndex = cmdArgs.indexOf("--db");
    const dbPath = dbArgIndex !== -1 ? cmdArgs[dbArgIndex + 1] : "target/dbt_ui.sqlite";

    const absDb = path.resolve(dbPath);

    if (!fs.existsSync(absDb)) {
        console.error(`❌ SQLite not found: ${absDb}`);
        console.error("Run 'dbt-ui generate' first.");
        process.exit(1);
    }

    console.log("🚀 Starting dbt-ui...");
    console.log("DB:", absDb);

    const childEnv = {
        ...process.env,
        DBT_UI_DB_PATH: absDb,
        PORT: port,
    };

    spawnSync("pnpm", ["-C", "apps/web/dbt-docs-redesign", "dev"], {
        stdio: "inherit",
        env: childEnv,
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
