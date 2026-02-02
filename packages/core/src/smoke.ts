import { openDb, initSchema } from "./sqlite.js";

const sqlitePath = process.argv[2] ?? "target/dbt_ui.sqlite";

const db = openDb(sqlitePath);
initSchema(db);

const objects = db
    .prepare(
        `SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name`
    )
    .all();

console.log("SQLite path:", sqlitePath);
console.log("Objects:", objects);

db.close();
