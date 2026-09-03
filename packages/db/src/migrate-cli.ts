import { createDb } from "./client.js";
import { requireDatabaseUrl } from "./load-env.js";
import { runMigrations } from "./migrate.js";

const { db, client } = createDb(requireDatabaseUrl());
await runMigrations(db);
await client.end();
console.log("migrations complete");
