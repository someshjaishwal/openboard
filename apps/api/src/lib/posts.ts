import { and, eq, inArray, ne, sql, type SQL } from "drizzle-orm";
import { posts, users, votes } from "@openboard/db";
import { db } from "../db.js";

export async function votedPostIds(userId: string, postIds: string[]) {
  if (postIds.length === 0) return new Set<string>();
  const rows = await db
    .select({ postId: votes.postId })
    .from(votes)
    .where(and(eq(votes.userId, userId), inArray(votes.postId, postIds)));
  return new Set(rows.map((row) => row.postId));
}

export async function loadPosts(opts: {
  includeHidden: boolean;
  status?: string;
  id?: string;
  userId?: string | null;
}) {
  const conditions: SQL[] = [];
  if (opts.id) conditions.push(eq(posts.id, opts.id));
  if (opts.status) conditions.push(eq(posts.status, opts.status));
  else if (!opts.includeHidden) conditions.push(ne(posts.status, "hidden"));

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      status: posts.status,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorName: users.name,
      voteCount: sql<number>`cast(count(${votes.userId}) as int)`,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(votes, eq(votes.postId, posts.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(posts.id, users.id)
    .orderBy(sql`${posts.createdAt} desc`);

  const mine = opts.userId
    ? await votedPostIds(
        opts.userId,
        rows.map((row) => row.id),
      )
    : new Set<string>();

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    author: { id: row.authorId, name: row.authorName },
    voteCount: Number(row.voteCount ?? 0),
    votedByMe: mine.has(row.id),
  }));
}
