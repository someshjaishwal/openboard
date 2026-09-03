import { migrate } from "drizzle-orm/postgres-js/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Database } from "./client.js";

export function migrationsFolder() {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "drizzle");
}

export async function runMigrations(db: Database) {
  await migrate(db, { migrationsFolder: migrationsFolder() });
}
