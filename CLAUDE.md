# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言

在本仓库中，与用户的问答、说明和注释请使用**简体中文**。

## Reference

- AGENTS.md contains Next.js version-specific rules — **read it before writing any Next.js code**. It points to `node_modules/next/dist/docs/` for this version's docs (APIs, conventions, and file structure may all differ from your training data).
- `dev-notes/` directory has detailed topic notes (TypeScript, Next.js, Prisma, Tailwind, issues log) written from a PHP developer's perspective. `dev-notes/07-project-summary.md` is the best one-stop overview.

## Commands

```bash
npm run dev       # Start dev server on localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint

npm run db:local        # Switch DATABASE_URL to the local PostgreSQL (.env rewrite)
npm run db:remote       # Switch DATABASE_URL to Neon remote
npm run sync:to-local   # Full overwrite sync: remote → local (pull cloud data down)
npm run sync:to-remote  # Full overwrite sync: local → remote (push local data up)

npx prisma db push      # Sync schema to current DATABASE_URL (local or remote)
npx prisma generate     # Regenerate Prisma Client after schema changes
npx prisma db seed      # Run prisma/seed.ts (requires dotenv)
npx tsx prisma/seed.ts  # Run seed directly (loads dotenv internally)
npx prisma studio        # Open database browser GUI
npx prisma format        # Format schema.prisma
```

`npm install` automatically runs `prisma generate` via the `postinstall` script — no need to run it separately after cloning.

## Architecture

```
middleware.ts               # Global auth gate: redirects unauthenticated requests to /login
lib/
├── prisma.ts               # Prisma Client factory + singleton (auto-selects Neon HTTP vs local pg adapter)
├── auth.ts                 # iron-session cookie-based auth (getSession(), isAuthenticated(), isAdmin())
├── utils.ts                # parsePgArray(), normalizeGameArrays()
├── igdb.ts                 # IGDB/Twitch API wrapper (searchIGDB)
└── steam.ts                # Steam Web API wrapper (library fetch/import)

scripts/                    # tsx-run DB helper scripts (switch-db.ts, sync-db.ts)

Client-side pages ("use client")          Server-side pages (default)
├── app/games/page.tsx                    ├── app/games/[id]/page.tsx
├── app/stats/page.tsx                    ├── app/timeline/page.tsx  ← calls Prisma directly
├── app/games/upcoming/page.tsx           ├── app/login/page.tsx
├── app/admin/* (all client)              └── app/page.tsx
└── Components: Navbar, Footer

API routes (app/api/):
├── GET/POST            /api/games
├── GET/PATCH/DELETE    /api/games/[id]
├── GET/POST            /api/upcoming
├── GET/PATCH/DELETE    /api/upcoming/[id]
├── POST                /api/auth/login  |  /api/auth/admin-login  |  /api/auth/logout
├── GET                 /api/auth/me
├── GET                 /api/steam/library  |  POST /api/steam/import
└── GET                 /api/igdb/search
```

- **Front/back separation via API routes**: Pages fetch from `/api/*`, never call Prisma directly. The exceptions are `app/timeline/page.tsx` and `app/games/[id]/page.tsx` — server components that query Prisma directly for server-rendered HTML.
- **Auth**: iron-session cookie-based (`lib/auth.ts`). Two independent tiers, see "Auth" below.
- **Database**: Neon PostgreSQL (serverless), accessed via Prisma 7 with `@prisma/adapter-neon` HTTP adapter.
- **Path alias**: `@/*` maps to the project root (configured in `tsconfig.json`).

## Data Patterns

**Always wrap Prisma game/upcoming results with `normalizeGameArrays()`** before returning to the client. `platforms` and `genres` are native PostgreSQL `TEXT[]` columns that may arrive as string literals (`{PC,Switch}`) depending on adapter state; `screenshots` is a `Json` column. `normalizeGameArrays()` is safe even when arrays are already parsed — it passes them through.

```typescript
import { normalizeGameArrays } from "@/lib/utils";
const games = await prisma.game.findMany({ where: { status: "completed" } });
return NextResponse.json({ games: games.map(normalizeGameArrays) });
```

## Auth — two tiers, enforced in different places

**Site login** (`SITE_USERNAME` + `SITE_PASSWORD`): POST `/api/auth/login` sets `session.isAuthenticated`. Enforced globally by `middleware.ts` — every non-public path redirects to `/login?from=<path>` when unauthenticated. Public paths are the hardcoded `PUBLIC_PATHS` list (`/login`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`) plus `_next/*` and favicon assets.

**Admin login** (`ADMIN_PASSWORD`): POST `/api/auth/admin-login` sets `session.isAdmin`. Enforced inside **mutating API routes** via `isAdmin()` — this check is the real protection, not the client-side admin UI:

```typescript
// API routes that mutate data:
import { isAdmin } from "@/lib/auth";
if (!(await isAdmin())) {
  return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
}
```

Both tiers share one iron-session cookie (`julesite-session`, 7-day TTL) and are independent — site login does not grant admin, and vice versa. `POST /api/auth/logout` takes `{ scope: "site" | "admin" }` to clear one tier, or no scope to destroy the whole session. The Navbar 退出 button sends `scope: "site"`; the admin layout's 退出管理模式 button sends `scope: "admin"`. GET `/api/auth/me` returns `{ isAuthenticated, username, isAdmin }` — client pages poll it to decide what UI to render.

## Database — Critical Configuration

Prisma 7 uses an **adapter pattern** — database URL is NOT in `schema.prisma`, it's in code:

- `prisma/schema.prisma` — model definitions only (no `url` in datasource block)
- `lib/prisma.ts` — creates `PrismaNeonHttp` adapter with `arrayMode: true` (REQUIRED for `String[]` columns). Uses singleton pattern (`globalThis.prisma`) to survive Next.js hot-reload.
- `prisma.config.ts` — datasource URL for CLI (`prisma db push`), separate from runtime adapter
- Client output path: `../app/generated/prisma` (in `.gitignore`)

**PostgreSQL arrays (`TEXT[]`)**:
- `platforms` and `genres` are native PostgreSQL `TEXT[]` arrays, NOT JSON
- The adapter MUST have `arrayMode: true` or they come back as string literals (`{PC,Switch}`)
- Filter with `where.platforms = { has: "PC" }` (SQL: `'PC' = ANY(platforms)`)
- `lib/utils.ts` exports `normalizeGameArrays()` — wrap Prisma results to ensure arrays

**Two Neon connection strings**:
- **Pooled** (`-pooler` in URL) → for `DATABASE_URL` env var (app runtime + Vercel)
- **Direct** (no `-pooler`) → for `prisma db push` (CLI operations only)

**After changing `lib/prisma.ts`, restart dev server** — the module singleton survives hot-reload, so adapter changes won't take effect until restart.

**Local / remote switching** (see `scripts/`):
- `.env` keeps both `LOCAL_DATABASE_URL` and `REMOTE_DATABASE_URL`; `DATABASE_URL` is the *active* one, rewritten by `npm run db:local` / `npm run db:remote`.
- `lib/prisma.ts` auto-selects the adapter by URL: `neon.tech` → `PrismaNeonHttp` (HTTP, `arrayMode: true`); anything else → `PrismaPg` (local TCP). Export `createPrismaClient(url?)` for scripts/seed that need a second connection.
- `sync-db.ts` reads both URLs explicitly, independent of `DATABASE_URL`. Full overwrite, reusing source `id`/cuid. **Neon HTTP does not support transactions AND auto-wraps `deleteMany`/`createMany` in one** — a remote target uses `$executeRawUnsafe` DELETE + per-row `create`; a local target uses `deleteMany` + `createMany` inside `$transaction` (atomic). Syncing *to remote* is non-atomic (idempotent rerun).
- After switching DB, restart the dev server and, if the target DB has no tables yet, run `npx prisma db push`.

## Environment Variables

```
DATABASE_URL=          # Active connection string — rewritten by db:local / db:remote, don't edit by hand
REMOTE_DATABASE_URL=   # Neon pooled connection string (required)
LOCAL_DATABASE_URL=    # Local PostgreSQL connection string (required for local dev)
SITE_USERNAME=         # Site login username (required)
SITE_PASSWORD=         # Site login password (required)
ADMIN_PASSWORD=        # Admin login password (required)
SESSION_SECRET=        # iron-session encryption (generate: openssl rand -hex 32)
STEAM_API_KEY=         # Optional: Steam Web API
IGDB_CLIENT_ID=        # Optional: Twitch IGDB
IGDB_CLIENT_SECRET=    # Optional: Twitch IGDB
```

`.env` is gitignored. `.env.example` is committed as a template for new devices.

## Multi-Device Workflow

```bash
git clone <repo-url> && npm install   # postinstall runs prisma generate automatically
cp .env.example .env                  # Fill in Neon URL + secrets
npm run dev                           # All devices share the same Neon cloud DB
```

## Production Deployment

- 线上站点：<https://jule-site.vercel.app>（Vercel 部署，push 到 `main` 自动触发）
- 线上凭据与本地 `.env` 独立，须在 Vercel 项目环境变量中单独配置（`SITE_USERNAME`/`SITE_PASSWORD`/`ADMIN_PASSWORD`/`SESSION_SECRET`/`DATABASE_URL` 等）
- 注意：登录成功后用的是**整页跳转**（`window.location.href`）而非 `router.push` —— 生产环境客户端导航可能漏带刚设置的 httpOnly cookie，见 `app/login/page.tsx` 注释

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` 16.2.7 | Framework (App Router) |
| `prisma` + `@prisma/client` 7.8 | ORM |
| `@prisma/adapter-neon` | Prisma ↔ Neon bridge |
| `iron-session` 8 | Cookie-based site + admin auth |
| `chart.js` + `react-chartjs-2` | Stats charts |
| `react-markdown` + `remark-gfm` | Game notes rendering |
| `tailwindcss` 4 | Styling with `@tailwindcss/postcss` (v4 uses CSS-first config, not `tailwind.config.js`) |

## Agent skills

### Issue tracker

Issues live in GitHub Issues at [jule259/juleSite](https://github.com/jule259/juleSite). See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five canonical triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` at root + `docs/adr/`. See `docs/agents/domain.md`.
