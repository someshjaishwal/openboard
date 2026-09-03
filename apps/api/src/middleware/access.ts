import type { Context, Next } from "hono";
import { env } from "../env.js";
import { verifyAccessJwt } from "../lib/access.js";
import type { AppEnv } from "./auth.js";

export async function requireAccess(c: Context<AppEnv>, next: Next) {
  if (env.adminDevBypass) {
    c.set("accessEmail", "dev@local");
    await next();
    return;
  }

  const token =
    c.req.header("x-access-jwt") ?? c.req.header("cf-access-jwt-assertion");
  if (!token) {
    return c.json({ error: "missing access token" }, 401);
  }

  try {
    const { email } = await verifyAccessJwt(token);
    c.set("accessEmail", email || "unknown");
    await next();
  } catch {
    return c.json({ error: "invalid access token" }, 401);
  }
}
