import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { migrateOnBoot } from "./db.js";
import { env } from "./env.js";
import type { AppEnv } from "./middleware/auth.js";
import { loadSession } from "./middleware/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { postRoutes } from "./routes/posts.js";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return env.corsOrigins[0] ?? "*";
      return env.corsOrigins.includes(origin) ? origin : "";
    },
    credentials: true,
    allowHeaders: ["Content-Type", "X-Access-Jwt", "Cf-Access-Jwt-Assertion"],
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  }),
);

app.use("*", loadSession);
app.route("/", healthRoutes);
app.route("/", authRoutes);
app.route("/", postRoutes);
app.route("/", adminRoutes);

app.notFound((c) => c.json({ error: "not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "internal error" }, 500);
});

await migrateOnBoot();

serve({ fetch: app.fetch, port: env.port, hostname: "0.0.0.0" }, (info) => {
  console.log(`openboard api listening on :${info.port}`);
});
