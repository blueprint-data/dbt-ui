import { openDb, initSchema } from "./sqlite";

const sqlitePath = process.argv[2] ?? "target/dbt_ui.sqlite";

(async () => {
    const db = await openDb(sqlitePath);
    initSchema(db);

    const objects = db.all(
        `SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name`
    );

    console.log("SQLite path:", sqlitePath);
    console.log("Objects:", objects);

    db.close();
})();
