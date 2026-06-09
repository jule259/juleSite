# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reference

- AGENTS.md contains Next.js version-specific rules — read it before writing Next.js code
- `dev-notes/` directory has detailed topic notes (TypeScript, Next.js, Prisma, Tailwind, issues log)

## Commands

```bash
npm run dev       # Start dev server on localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint

npx prisma db push      # Sync schema to Neon database
npx prisma generate     # Regenerate Prisma Client after schema changes
npx prisma db seed     # Run prisma/seed.ts (requires dotenv)
npx tsx prisma/seed.ts # Run seed directly
```

## Architecture

```
Client-side pages ("use client")          Server-side pages (default)
├── app/games/page.tsx                    ├── app/games/[id]/page.tsx
├── app/stats/page.tsx                    ├── app/timeline/page.tsx
├── app/games/upcoming/page.tsx           └── app/page.tsx
├── app/admin/* (all client)
└── Components: Navbar, Footer

API routes (app/api/):
├── GET/POST    /api/games
├── GET/PATCH/DELETE  /api/games/[id]
├── GET/POST    /api/upcoming
├── GET/PATCH/DELETE  /api/upcoming/[id]
├── POST        /api/auth/login | /api/auth/logout
├── GET         /api/steam/library  | POST /api/steam/import
└── GET         /api/igdb/search
```

- **Front/back separation via API routes**: Pages fetch from `/api/*`, never call Prisma directly (except server components like `timeline/page.tsx`)
- **Auth**: iron-session cookie-based (`lib/auth.ts`). Admin-only routes check `isAdmin()` before mutating
- **Database**: Neon PostgreSQL (serverless), accessed via Prisma 7 with `@prisma/adapter-neon` HTTP adapter

## Database — Critical Configuration

Prisma 7 uses an **adapter pattern** — database URL is NOT in `schema.prisma`, it's in code:

- `prisma/schema.prisma` — model definitions only (no `url` in datasource block)
- `lib/prisma.ts` — creates `PrismaNeonHttp` adapter with `arrayMode: true` (REQUIRED for `String[]` columns)
- `prisma.config.ts` — datasource URL for CLI (`prisma db push`)
- Client output path: `../app/generated/prisma` (in `.gitignore`)

**PostgreSQL arrays (`TEXT[]`)**:
- `platforms` and `genres` are native PostgreSQL `TEXT[]` arrays, NOT JSON
- The adapter MUST have `arrayMode: true` or they come back as string literals (`{PC,Switch}`)
- Filter with `where.platforms = { has: "PC" }` (SQL: `'PC' = ANY(platforms)`)
- `lib/utils.ts` exports `normalizeGameArrays()` — wrap Prisma results to ensure arrays

**Two Neon connection strings**:
- **Pooled** (`-pooler` in URL) → for `DATABASE_URL` env var (app runtime)
- **Direct** (no `-pooler`) → for `prisma db push` (CLI operations only)

**After changing `lib/prisma.ts`, restart dev server** — the module singleton survives hot-reload.

## Auth Pattern

```typescript
// API routes that need admin:
import { isAdmin } from "@/lib/auth";
if (!(await isAdmin())) {
  return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
}
```

Admin login at `/admin` → POST `/api/auth/login` with `{ password }` → iron-session cookie set.

## Environment Variables

```
DATABASE_URL=          # Neon pooled connection (required)
ADMIN_PASSWORD=        # Admin login password
SESSION_SECRET=        # iron-session encryption (generate: openssl rand -hex 32)
STEAM_API_KEY=         # Optional: Steam Web API
IGDB_CLIENT_ID=        # Optional: Twitch IGDB
IGDB_CLIENT_SECRET=    # Optional: Twitch IGDB
```

`.env` is gitignored. `.env.example` is committed as a template for new devices.

## Multi-Device Workflow

```bash
git clone <repo-url> && npm install
cp .env.example .env   # Fill in Neon URL + secrets
npx prisma generate    # Generate Prisma Client from schema
npm run dev            # All devices share the same Neon cloud DB
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` 16.2.7 | Framework (App Router) |
| `prisma` + `@prisma/client` 7.8 | ORM |
| `@prisma/adapter-neon` | Prisma ↔ Neon bridge |
| `iron-session` 8 | Cookie-based admin auth |
| `chart.js` + `react-chartjs-2` | Stats charts |
| `react-markdown` + `remark-gfm` | Game notes rendering |
| `tailwindcss` 4 | Styling with `@tailwindcss/postcss` |
