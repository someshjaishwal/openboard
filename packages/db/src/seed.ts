import bcrypt from "bcryptjs";
import { createDb } from "./client.js";
import { requireDatabaseUrl } from "./load-env.js";
import { runMigrations } from "./migrate.js";
import { posts, users, votes } from "./schema.js";

const { db, client } = createDb(requireDatabaseUrl());
await runMigrations(db);

const existing = await db.select({ id: users.id }).from(users).limit(1);
if (existing.length > 0) {
  console.log("seed skipped (users already exist)");
  await client.end();
  process.exit(0);
}

const passwordHash = await bcrypt.hash("demo1234", 10);

const [ada] = await db
  .insert(users)
  .values({
    email: "ada@openboard.dev",
    name: "Ada Lovelace",
    passwordHash,
  })
  .returning();

const [grace] = await db
  .insert(users)
  .values({
    email: "grace@openboard.dev",
    name: "Grace Hopper",
    passwordHash,
  })
  .returning();

if (!ada || !grace) {
  throw new Error("failed to insert seed users");
}

const inserted = await db
  .insert(posts)
  .values([
    {
      authorId: ada.id,
      title: "Show vote counts on the board",
      body: "The public board should make it obvious which requests the community wants most.",
      status: "shipped",
    },
    {
      authorId: grace.id,
      title: "Keyboard shortcuts for power users",
      body: "Let me submit a request without taking my hands off the keyboard.",
      status: "planned",
    },
    {
      authorId: ada.id,
      title: "RSS feed of shipped work",
      body: "I want to subscribe to status changes instead of refreshing the page.",
      status: "open",
    },
  ])
  .returning();

const first = inserted[0];
if (first) {
  await db.insert(votes).values([
    { userId: ada.id, postId: first.id },
    { userId: grace.id, postId: first.id },
  ]);
}

console.log("seeded ada@openboard.dev / grace@openboard.dev (password: demo1234)");
await client.end();
