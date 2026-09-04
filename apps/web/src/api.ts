export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3100").replace(
  /\/$/,
  "",
);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${API_URL}. Set VITE_API_URL to your Railway URL and rebuild.`,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `API at ${API_URL} returned ${contentType || "non-JSON"} for ${path}. Check VITE_API_URL.`,
    );
  }

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `request failed (${res.status})`);
  }
  return data;
}

export const api = {
  me: () => request<{ user: { id: string; email: string; name: string } }>("/auth/me"),
  register: (body: { email: string; name: string; password: string }) =>
    request<{ user: { id: string; email: string; name: string } }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ user: { id: string; email: string; name: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  posts: (status?: string) =>
    request<{ posts: import("@openboard/shared").PublicPost[] }>(
      status ? `/posts?status=${encodeURIComponent(status)}` : "/posts",
    ),
  post: (id: string) =>
    request<{ post: import("@openboard/shared").PublicPost }>(`/posts/${id}`),
  createPost: (body: { title: string; body: string }) =>
    request<{ post: import("@openboard/shared").PublicPost }>("/posts", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  vote: (id: string) =>
    request<{ voted: boolean; voteCount: number }>(`/posts/${id}/vote`, { method: "POST" }),
};
