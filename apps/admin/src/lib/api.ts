import { headers } from "next/headers";
import { env } from "./env";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const incoming = await headers();
  const jwt = incoming.get("x-access-jwt");
  const requestHeaders = new Headers(init.headers);
  if (init.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (jwt) {
    requestHeaders.set("X-Access-Jwt", jwt);
  }

  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: requestHeaders,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `API ${res.status}`);
  }
  return data;
}
