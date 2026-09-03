export { createDb, type Database } from "./client.js";
export { runMigrations, migrationsFolder } from "./migrate.js";
export {
  posts,
  postsRelations,
  schema,
  users,
  usersRelations,
  votes,
  votesRelations,
} from "./schema.js";
