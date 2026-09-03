import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { users } from "@openboard/db";
import { loginSchema, registerSchema } from "@openboard/shared";
import { db } from "../db.js";
import { clearSessionCookie, setSessionCookie } from "../lib/cookies.js";
import { signSession } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { type AppEnv, requireUser } from "../middleware/auth.js";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/auth/register", async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid input", details: parsed.error.flatten() }, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return c.json({ error: "email already registered" }, 409);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: parsed.data.name,
      passwordHash,
    })
    .returning({ id: users.id, email: users.email, name: users.name });

  if (!user) {
    return c.json({ error: "failed to create user" }, 500);
  }

  const token = await signSession({ sub: user.id, email: user.email, name: user.name });
  setSessionCookie(c, token);
  return c.json({ user }, 201);
});

authRoutes.post("/auth/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid input" }, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return c.json({ error: "invalid email or password" }, 401);
  }

  const token = await signSession({ sub: user.id, email: user.email, name: user.name });
  setSessionCookie(c, token);
  return c.json({ user: { id: user.id, email: user.email, name: user.name } });
});

authRoutes.post("/auth/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

authRoutes.get("/auth/me", requireUser, (c) => {
  return c.json({ user: c.get("user") });
});
