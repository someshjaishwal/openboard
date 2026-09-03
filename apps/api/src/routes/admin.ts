import { desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { posts, users, votes } from "@openboard/db";
import { patchPostSchema } from "@openboard/shared";
import { db } from "../db.js";
import { loadPosts } from "../lib/posts.js";
import { requireAccess } from "../middleware/access.js";
import type { AppEnv } from "../middleware/auth.js";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("/admin/*", requireAccess);

adminRoutes.get("/admin/stats", async (c) => {
  const [userCount] = await db.select({ n: sql<number>`cast(count(*) as int)` }).from(users);
  const [postCount] = await db.select({ n: sql<number>`cast(count(*) as int)` }).from(posts);
  const [voteCount] = await db.select({ n: sql<number>`cast(count(*) as int)` }).from(votes);
  const statusRows = await db
    .select({
      status: posts.status,
      n: sql<number>`cast(count(*) as int)`,
    })
    .from(posts)
    .groupBy(posts.status);

  const byStatus = { open: 0, planned: 0, shipped: 0, hidden: 0 };
  for (const row of statusRows) {
    if (row.status in byStatus) {
      byStatus[row.status as keyof typeof byStatus] = Number(row.n);
    }
  }

  return c.json({
    stats: {
      users: Number(userCount?.n ?? 0),
      posts: Number(postCount?.n ?? 0),
      votes: Number(voteCount?.n ?? 0),
      byStatus,
    },
    actor: c.get("accessEmail"),
  });
});

adminRoutes.get("/admin/users", async (c) => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return c.json({
    users: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    actor: c.get("accessEmail"),
  });
});

adminRoutes.get("/admin/posts", async (c) => {
  const items = await loadPosts({ includeHidden: true, userId: null });
  return c.json({ posts: items, actor: c.get("accessEmail") });
});

adminRoutes.patch("/admin/posts/:id", async (c) => {
  const parsed = patchPostSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid input" }, 400);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "not found" }, 404);
  }

  const [updated] = await db
    .update(posts)
    .set({ status: parsed.data.status })
    .where(eq(posts.id, id))
    .returning({ id: posts.id });

  if (!updated) {
    return c.json({ error: "not found" }, 404);
  }

  const items = await loadPosts({ includeHidden: true, id: updated.id });
  return c.json({
    post: items[0],
    actor: c.get("accessEmail"),
  });
});
