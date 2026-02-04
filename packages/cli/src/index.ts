#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFromManifest, openDb } from "@dbt-ui/core";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
            await buildFromManifest(manifestPath, sqlitePath);

            const db = await openDb(sqlitePath);
            const counts = db.get(`
        SELECT 
          (SELECT count(*) FROM model) as models,
          (SELECT count(*) FROM column_def) as columns,
          (SELECT count(*) FROM edge) as edges,
          (SELECT count(*) FROM search_docs) as search_docs
      `) as { models: number; columns: number; edges: number; search_docs: number };
            db.close();

            console.log("SUCCESS: Database generated.");
            console.log(`- Models: ${counts.models}`);
            console.log(`- Columns: ${counts.columns}`);
            console.log(`- Edges: ${counts.edges}`);
            console.log(`- Search entries: ${counts.search_docs}`);
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
        console.error(`Expected at: ${absDb}`);
        console.error("\nTo fix this:");
        console.error("1. Run 'dbt-ui generate' in your dbt project root.");
        console.error("2. Or use --db <path> to specify the database location.");
        process.exit(1);
    }

    console.log("\n============================================================");
    console.log("🚀 dbt-ui is starting...");
    console.log("============================================================\n");
    console.log(`📂 Database: ${absDb}`);
    console.log(`🌐 URL:      http://localhost:${port}`);
    console.log("\nPress Ctrl+C to stop.");
    console.log("------------------------------------------------------------\n");

    const childEnv = {
        ...process.env,
        DBT_UI_DB_PATH: absDb,
        PORT: port,
        NODE_ENV: "production" as any,
    };

    // Try to find the web app in various locations
    // 1. Monorepo dev: packages/cli -> ../../apps/web/dbt-docs-redesign
    // 2. Standalone build: packages/cli -> ../../apps/web/dbt-docs-redesign/.next/standalone
    // 3. Installed package: node_modules/@dbt-ui/cli -> ../web-app

    const possiblePaths = [
        // Standalone build (production) - Next.js preserves the folder structure
        path.resolve(__dirname, "../../apps/web/dbt-docs-redesign/.next/standalone/apps/web/dbt-docs-redesign"),
        // Monorepo dev
        path.resolve(__dirname, "../../apps/web/dbt-docs-redesign"),
        // Installed from npm
        path.resolve(__dirname, "../web-app"),
    ];

    let webAppDir: string | null = null;
    let isStandalone = false;

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            webAppDir = p;
            // Check if it's a standalone build
            if (p.includes("standalone") || fs.existsSync(path.join(p, "server.js"))) {
                isStandalone = true;
            }
            break;
        }
    }

    if (!webAppDir) {
        console.error("❌ Error: Web application not found.");
        console.error("Searched in:");
        possiblePaths.forEach(p => console.error(`  - ${p}`));
        console.error("\nTry building the web app first:");
        console.error("  cd apps/web/dbt-docs-redesign && npm run build");
        process.exit(1);
    }

    console.log(`📦 Mode: ${isStandalone ? "Standalone" : "Development"}`);
    console.log(`📁 App:  ${webAppDir}\n`);

    if (isStandalone) {
        // For standalone builds, ensure static and public dirs are in place
        const standaloneDir = webAppDir;
        // Go up from .next/standalone/apps/web/dbt-docs-redesign to apps/web/dbt-docs-redesign
        const sourceDir = path.resolve(standaloneDir, "../../../../..");

        // Copy static files if not present (needed for standalone)
        const staticDest = path.join(standaloneDir, ".next/static");
        const staticSrc = path.join(sourceDir, ".next/static");
        if (!fs.existsSync(staticDest) && fs.existsSync(staticSrc)) {
            fs.cpSync(staticSrc, staticDest, { recursive: true });
        }

        // Copy public files if not present
        const publicDest = path.join(standaloneDir, "public");
        const publicSrc = path.join(sourceDir, "public");
        if (!fs.existsSync(publicDest) && fs.existsSync(publicSrc)) {
            fs.cpSync(publicSrc, publicDest, { recursive: true });
        }

        // Run the standalone server directly with Node
        spawnSync("node", ["server.js"], {
            stdio: "inherit",
            env: childEnv,
            cwd: standaloneDir,
        });
    } else {
        // Development mode - use npm start
        spawnSync("npm", ["run", "start"], {
            stdio: "inherit",
            env: childEnv,
            cwd: webAppDir,
        });
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
