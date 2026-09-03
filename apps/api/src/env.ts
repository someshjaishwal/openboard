import { config } from "dotenv";

config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

const isProd = process.env.NODE_ENV === "production";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd,
  port: Number(optional("PORT", "3100")),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  corsOrigins: optional(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3001",
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  cookieSecure: bool("COOKIE_SECURE", isProd),
  cookieSameSite: (optional("COOKIE_SAMESITE", isProd ? "none" : "lax") as
    | "lax"
    | "strict"
    | "none"),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  adminDevBypass: bool("ADMIN_DEV_BYPASS", !isProd),
  cfAccessTeamDomain: process.env.CF_ACCESS_TEAM_DOMAIN || "",
  cfAccessAud: process.env.CF_ACCESS_AUD || "",
};
