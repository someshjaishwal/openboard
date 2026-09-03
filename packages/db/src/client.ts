import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema.js";

export type Database = PostgresJsDatabase<typeof schema>;

export function createDb(url: string) {
  // prepare: false is required for Neon pooled (PgBouncer) connections.
  const client = postgres(url, { max: 10, prepare: false });
  const db = drizzle(client, { schema });
  return { db, client };
}
