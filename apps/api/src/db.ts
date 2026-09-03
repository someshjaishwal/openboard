import { createDb, runMigrations } from "@openboard/db";
import { env } from "./env.js";

const { db, client } = createDb(env.databaseUrl);

export { db, client };

export async function migrateOnBoot() {
  await runMigrations(db);
}
