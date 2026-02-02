import { buildFromManifest } from "./build.js";

const manifestPath = process.argv[2] ?? "target/manifest.json";
const sqlitePath = process.argv[3] ?? "target/dbt_ui.sqlite";

buildFromManifest(manifestPath, sqlitePath);
console.log("OK: built sqlite at", sqlitePath);
