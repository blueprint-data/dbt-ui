#!/usr/bin/env node
import { execSync } from "node:child_process";
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
    } else {
        console.log("Usage: dbt-ui generate [--manifest <path>] [--out <path>] [--skip-dbt]");
    }
}

function getArgValue(flag: string): string | null {
    const index = args.indexOf(flag);
    if (index !== -1 && args[index + 1]) {
        return args[index + 1];
    }
    return null;
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
