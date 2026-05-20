# TrasMart — Claude Code Instructions

## Commands

- `npm run dev` — Next.js 16 dev server
- `npm run build` — production build
- `npm run lint` — ESLint 9 (flat config, `eslint.config.mjs`)
- No test framework or test files exist
- No CI/CD (no `.github/workflows/`)
- Prettier is a devDep but has no config file (no `.prettierrc`); do not add or rely on it

## Architecture

- **Framework:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4 + SCSS Modules
- **Auth:** Supabase SSR (`@supabase/ssr`) — 3 client variants in `src/lib/utils/supabase/`:
  - `client.ts` — browser singleton
  - `server.ts` — server component client
  - `middleware.ts` — middleware client
- **Path alias:** `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- **Timezone:** All date/time ops use `Asia/Jakarta` (WIB)

## Routing

`next.config.ts` uses rewrites to serve `(app)/*` under clean URLs:

```
/dashboard, /account, /reward, /masukkan-kode, /auth/login, /auth/register
```

Actual files live in `src/app/(app)/{dashboard,account,reward,masukkan-kode}/` and `src/app/auth/{login,register}/`.

When creating new pages under `(app)/`, always add a corresponding rewrite in `next.config.ts`.

## Auth Middleware

`src/middleware.ts` protects `/dashboard`, `/account`, `/reward`, `/masukkan-kode` (and their rewrite targets). Redirects authenticated users away from `/auth/*` and the landing page.

When adding new protected routes, update the middleware matcher.

## Key Directories

| Path | Purpose |
|---|---|
| `src/app/(app)/` | Authenticated app pages |
| `src/app/auth/` | Login, register, reset-password, OAuth callback |
| `src/app/api/` | Machine pairing/session/refresh API routes |
| `src/components/layout/` | Sidebar, topbar, modals, notification bell |
| `src/contexts/` | UserContext, SidebarContext, themeContext |
| `src/hooks/` | `useAuth`, `useGoback` |
| `src/lib/data/` | Business logic: dashboard, points, reward data |
| `src/types/` | Dashboard & reward type definitions |
| `IOT/` | **PlatformIO** ESP32 Arduino firmware (separate project) |

## Style Guide

- Use **SCSS Modules** (`.module.scss`) for all component-level styles
- Use **Tailwind utility classes** only in global styles
- Theme tokens live in `src/components/theme/_tokens.scss` — reference these instead of hardcoding colors/sizes
- New components must follow the existing `ComponentName/ComponentName.module.scss` pattern

## Supabase

- Client creation helpers are in `src/lib/utils/supabase/` — use the appropriate variant (`client.ts` for browser, `server.ts` for server components/actions, `middleware.ts` for middleware)
- RPCs in use: `pair_user_with_machine(p_session_code)`, `refresh_session_expiry(p_machine_id)`
- `.env.local` is committed and contains the Supabase project URL + publishable anon key

## IoT Firmware

- Lives in `IOT/` — PlatformIO ESP32 Arduino project (separate from the web app)
- `IOT/src/main.cpp` calls Supabase REST API directly with the anon key
- Tutorial at `CLOUD_COMPUTING_TUTORIAL.md`

## Important Rules

1. Always use the `@/*` path alias for imports (e.g., `@/components/...`, `@/lib/...`)
2. Never create test files — no test framework is configured
3. All date/time operations must use `Asia/Jakarta` timezone
4. Do not add or configure Prettier
5. When modifying routes, update both the page file and `next.config.ts` rewrites
6. When adding protected routes, update `src/middleware.ts`
