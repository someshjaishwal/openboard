import { COOKIE_NAME } from "@openboard/shared";
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifySession } from "../lib/jwt.js";

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
};

export type AppEnv = {
  Variables: {
    user: AuthedUser | null;
    accessEmail: string | null;
  };
};

export async function loadSession(c: Context<AppEnv>, next: Next) {
  c.set("user", null);
  const token = getCookie(c, COOKIE_NAME);
  if (!token) {
    await next();
    return;
  }
  try {
    const claims = await verifySession(token);
    c.set("user", { id: claims.sub, email: claims.email, name: claims.name });
  } catch {
    c.set("user", null);
  }
  await next();
}

export async function requireUser(c: Context<AppEnv>, next: Next) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
}
