import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import type { AppEnv } from "../middleware/auth.js";

export const healthRoutes = new Hono<AppEnv>();

healthRoutes.get("/health", async (c) => {
  try {
    await db.execute(sql`select 1`);
    return c.json({ ok: true, db: true });
  } catch {
    return c.json({ ok: false, db: false }, 503);
  }
});
