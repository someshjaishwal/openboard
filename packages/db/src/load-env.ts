import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

const candidates = [
  resolve(process.cwd(), ".env"),
  resolve(repoRoot, ".env"),
  resolve(repoRoot, "apps/api/.env"),
];

export function loadEnvFiles() {
  for (const path of candidates) {
    if (existsSync(path)) {
      config({ path, override: false });
    }
  }
}

export function requireDatabaseUrl() {
  loadEnvFiles();
  const url = process.env.DATABASE_URL;
  if (url && !url.includes("USER:PASSWORD@HOST")) {
    return url;
  }

  throw new Error(
    [
      "DATABASE_URL is missing or still the placeholder from .env.example.",
      "Create apps/api/.env (copy from apps/api/.env.example) and set DATABASE_URL.",
      "Local:  pnpm db:up  then use postgresql://openboard:openboard@localhost:55432/openboard",
      "Neon:   paste the pooled URI (host contains -pooler).",
    ].join("\n"),
  );
}
