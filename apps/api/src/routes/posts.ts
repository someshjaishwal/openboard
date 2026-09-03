import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { posts, votes } from "@openboard/db";
import { createPostSchema, publicPostStatuses } from "@openboard/shared";
import { db } from "../db.js";
import { loadPosts } from "../lib/posts.js";
import { type AppEnv, requireUser } from "../middleware/auth.js";

export const postRoutes = new Hono<AppEnv>();

postRoutes.get("/posts", async (c) => {
  const status = c.req.query("status");
  if (status && !publicPostStatuses.includes(status as (typeof publicPostStatuses)[number])) {
    return c.json({ error: "invalid status" }, 400);
  }
  const items = await loadPosts({
    includeHidden: false,
    status,
    userId: c.get("user")?.id ?? null,
  });
  return c.json({ posts: items });
});

postRoutes.get("/posts/:id", async (c) => {
  const items = await loadPosts({
    includeHidden: false,
    id: c.req.param("id"),
    userId: c.get("user")?.id ?? null,
  });
  const post = items[0];
  if (!post) {
    return c.json({ error: "not found" }, 404);
  }
  return c.json({ post });
});

postRoutes.post("/posts", requireUser, async (c) => {
  const parsed = createPostSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid input", details: parsed.error.flatten() }, 400);
  }
  const user = c.get("user")!;
  const [row] = await db
    .insert(posts)
    .values({
      authorId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
    })
    .returning({ id: posts.id });

  if (!row) {
    return c.json({ error: "failed to create post" }, 500);
  }

  const items = await loadPosts({ includeHidden: false, id: row.id, userId: user.id });
  return c.json({ post: items[0] }, 201);
});

postRoutes.post("/posts/:id/vote", requireUser, async (c) => {
  const user = c.get("user")!;
  const postId = c.req.param("id");
  if (!postId) {
    return c.json({ error: "not found" }, 404);
  }
  const [post] = await db
    .select({ id: posts.id, status: posts.status })
    .from(posts)
    .where(eq(posts.id, postId));

  if (!post || post.status === "hidden") {
    return c.json({ error: "not found" }, 404);
  }

  const [existing] = await db
    .select({ userId: votes.userId })
    .from(votes)
    .where(and(eq(votes.userId, user.id), eq(votes.postId, postId)));

  let voted: boolean;
  if (existing) {
    await db.delete(votes).where(and(eq(votes.userId, user.id), eq(votes.postId, postId)));
    voted = false;
  } else {
    await db.insert(votes).values({ userId: user.id, postId });
    voted = true;
  }

  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(votes)
    .where(eq(votes.postId, postId));

  return c.json({ voted, voteCount: Number(countRow?.count ?? 0) });
});
