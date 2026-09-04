# OpenBoard

A public feature-request board used as a **hands-on lab** for four platforms:

| Piece | Platform | What it actually does here |
| --- | --- | --- |
| API | [Railway](https://railway.com) | Long-running Hono/Node process, healthcheck, region pin, env vars |
| Database | [Neon](https://neon.tech) Postgres | Schema + migrations; pooled TCP from Railway (not the serverless HTTP driver) |
| Public web | [Cloudflare Pages](https://pages.cloudflare.com) | Static Vite SPA; talks to the API from the browser |
| Admin | [Vercel](https://vercel.com) + [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/) | Next.js operator console. Access gates humans; the API still verifies the Access JWT |

Two auth systems on purpose:

1. **End users** sign up with email + password. The API sets an httpOnly session cookie.
2. **Operators** never see a password form. Cloudflare Access sits in front of the Vercel admin. The admin server forwards the Access JWT to Railway so `/admin/*` is not “UI-only” security.

```
visitor  →  Cloudflare Pages (web)  →  Railway API  →  Neon
operator →  Cloudflare Access → Vercel admin → Railway /admin/* → Neon
```

## Repo

```
apps/api       Railway  (Hono + Drizzle)
apps/web       Cloudflare Pages  (Vite + React)
apps/admin     Vercel  (Next.js App Router)
packages/db    Drizzle schema + SQL migrations
packages/shared  Zod schemas and shared types
```

## Prerequisites

- Node 22+ and pnpm 9
- Accounts: GitHub, Neon, Railway, Cloudflare (Pages + Zero Trust), Vercel
- A Cloudflare-managed domain **only for Phase 2**. Phase 1 uses `*.up.railway.app`, `*.pages.dev`, and `*.vercel.app`.

## Region pair (lock this first)

Neon’s region **cannot be changed** after project creation. Put Railway in the same place.

| Where you are | Railway region | Neon region |
| --- | --- | --- |
| India / SE Asia (default in this repo) | `asia-southeast1-eqsg3a` (Singapore) | `aws-ap-southeast-1` (Singapore) |
| US | `us-east4-eqdc4a` (Virginia) | `aws-us-east-1` (N. Virginia) |

If you pick US East, edit `railway.json` and `apps/api/railway.json` and replace `asia-southeast1-eqsg3a` with `us-east4-eqdc4a`.

On Neon, copy the **pooled** connection string (host contains `-pooler`). Railway is a persistent process, so the API uses TCP via `postgres.js` with `prepare: false` (required for PgBouncer). Do **not** use Neon’s serverless HTTP driver here — that one is for Vercel/edge.

## Local

Local Postgres (no Neon account yet):

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env.local

# apps/api/.env already defaults to this URL after you copy the example,
# or use postgresql://openboard:openboard@localhost:55432/openboard
pnpm db:up
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`pnpm db:up` starts Postgres 16 in Docker. Demo login after seed: `ada@openboard.dev` / `demo1234`.

To use Neon instead, paste the **pooled** connection string into `apps/api/.env` as `DATABASE_URL` (do not leave the `USER:PASSWORD@HOST` placeholder).

| App | URL |
| --- | --- |
| API | http://localhost:3100  (`GET /health`) |
| Web | http://localhost:5173 |
| Admin | http://localhost:3001  (`ADMIN_DEV_BYPASS=true` skips Access) |

`pnpm dev` starts all three. Use `pnpm dev:api` / `dev:web` / `dev:admin` to run one.

### Quick API checks

```bash
curl -s localhost:3100/health
curl -s localhost:3100/posts
curl -s -c cookies -X POST localhost:3100/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"ada@openboard.dev","password":"demo1234"}'
curl -s -b cookies localhost:3100/auth/me
```

## Phase 1 — platform default URLs

No custom domain yet. CORS and cookies are set for cross-site (`SameSite=None; Secure` on Railway).

### 1. Neon

1. New project in the region from the table above.
2. Enable the connection pooler if it is not already on.
3. Copy the pooled URI into Railway as `DATABASE_URL`.

### 2. Railway (API)

1. New project → deploy from this GitHub repo (service root = **repository root**, not `apps/api`).
2. The root [`railway.json`](railway.json) builds the [`Dockerfile`](Dockerfile) and pins Singapore. Healthcheck is `GET /health`.
3. Variables:

```
DATABASE_URL          Neon pooled URI
JWT_SECRET            long random string
CORS_ORIGINS          https://<web>.pages.dev,https://<admin>.vercel.app
COOKIE_SECURE         true
COOKIE_SAMESITE       none
ADMIN_DEV_BYPASS      true          # until Phase 2
PORT                  3000
```

4. Generate a public URL. Confirm `https://<api>/health` returns `{"ok":true,"db":true}`.
5. Optional: `railway run pnpm db:seed` (or run seed locally against the same `DATABASE_URL`).

The API runs migrations on boot.

### 3. Cloudflare Pages (web)

1. Pages → Create → connect the same repo.
2. This is a pnpm monorepo. **Do not leave Root directory as `/`** — Wrangler then scans the whole workspace and fails. Set:

| Field | Value |
| --- | --- |
| **Root directory** | `apps/web` |
| **Build command** | `cd ../.. && pnpm install && pnpm --filter @openboard/web build` |
| **Build output directory** | `dist` |
| **Deploy command** | `pnpm exec wrangler deploy` |
| **Version command** | `pnpm exec wrangler versions upload` |

This repo deploys as a **Worker with static assets** (`[assets]` in `apps/web/wrangler.toml`), not `wrangler pages deploy`. There is no Pages project named `openboard` on this account. `pnpm exec` is required because bare `wrangler` is not on PATH.

3. Environment variable (Production): `VITE_API_URL=https://<your-railway-host>`  
   This is baked in at **build** time. Rebuild after changing it.
4. After the Pages URL exists, add it to Railway `CORS_ORIGINS` and redeploy the API.

SPA deep links are handled by `not_found_handling = "single-page-application"` in `apps/web/wrangler.toml`. Do not add a Pages-style `/* /index.html` `_redirects` rule — Workers treat that as an infinite loop.

### 4. Vercel (admin)

1. New Vercel project → same repo.
2. **Root Directory:** `apps/admin`. Vercel walks up to the pnpm workspace at the repo root.
3. Environment variables:

```
API_URL              https://<your-railway-host>
ADMIN_DEV_BYPASS     true          # until Phase 2
```

4. Add the Vercel URL to Railway `CORS_ORIGINS` (needed if anything in the admin ever called the API from the browser; server-side fetches do not use CORS, but keep the list accurate).
5. Open the Vercel URL. Overview / Posts / Users should load. Change a post status — it PATCHes Railway `/admin/posts/:id` from the Next.js server, not from the browser.

At this point you have exercised Railway, Neon, Pages, and Vercel. Access is Phase 2.

## Phase 2 — custom domain + Cloudflare Access

You need a zone on Cloudflare, e.g. `example.com`.

### DNS

| Hostname | Target | Proxy |
| --- | --- | --- |
| `app.example.com` | Cloudflare Pages | DNS only or proxied (Pages) |
| `api.example.com` | Railway CNAME | DNS only (grey cloud) unless you know you want CF in front of the API |
| `admin.example.com` | Vercel CNAME | **Proxied (orange cloud)** — required so Access can sit in front |

Add the custom domains in the Pages, Railway, and Vercel dashboards first, then the DNS records.

### Cookies on a shared parent domain

Railway variables:

```
COOKIE_DOMAIN      .example.com
COOKIE_SAMESITE    lax
COOKIE_SECURE      true
CORS_ORIGINS       https://app.example.com,https://admin.example.com
```

`app` and `api` are same-site, so `Lax` is enough for the user session cookie.

### Cloudflare Access

1. Zero Trust → Access → Applications → Add self-hosted.
2. Application domain: `admin.example.com` (path `/`).
3. Policy: Allow, include your email (OTP or an IdP).
4. Copy:

- **Team domain:** `https://<team>.cloudflareaccess.com`
- **Application Audience (AUD)** tag

5. Set on **both** Vercel and Railway, then turn the bypass off:

```
CF_ACCESS_TEAM_DOMAIN    https://<team>.cloudflareaccess.com
CF_ACCESS_AUD            <aud tag>
ADMIN_DEV_BYPASS         false
```

6. Redeploy admin + API.

What happens on a request:

1. Browser hits `admin.example.com` → Access login.
2. Cloudflare sends `Cf-Access-Jwt-Assertion` to Vercel.
3. Next.js `middleware.ts` verifies that JWT (JWKS from the team domain) and copies it to `x-access-jwt`. Incoming spoofed copies of that header are stripped first.
4. Server components / server actions `fetch` Railway with `X-Access-Jwt`.
5. Railway `/admin/*` verifies the same JWT. The actor email is returned in admin payloads.

The Access cookie is host-scoped to `admin.`. The browser must **not** call Railway admin routes directly; they would not send that cookie.

## What each env var is for

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Railway, local API | Neon pooled URI |
| `JWT_SECRET` | Railway, local API | Signs the user session cookie |
| `CORS_ORIGINS` | Railway | Web + admin origins |
| `COOKIE_*` | Railway | Session cookie flags |
| `VITE_API_URL` | Pages / `apps/web` | Public API base (baked in at **build** time) |
| `API_URL` | Vercel / `apps/admin` | Server-side API base |
| `ADMIN_DEV_BYPASS` | API + admin | Skip Access JWT locally / Phase 1 |
| `CF_ACCESS_TEAM_DOMAIN` | API + admin | Access JWT issuer |
| `CF_ACCESS_AUD` | API + admin | Access JWT audience |

## Stretch (not in this cut)

- Neon branch per PR + Railway PR deploy
- Email verification / OAuth for end users
- Protect Vercel preview URLs with a second Access application

## Scripts

```
pnpm dev           all three apps
pnpm db:migrate    apply Drizzle SQL in packages/db/drizzle
pnpm db:seed       demo users + posts (no-ops if users exist)
pnpm --filter @openboard/shared test
```
