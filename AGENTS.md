# TrasMart — AGENTS.md

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

## Routing Quirk

`next.config.ts` uses rewrites to serve `(app)/*` under clean URLs:
```
/dashboard, /account, /reward, /masukkan-kode, /auth/login, /auth/register
```
Actual files live in `src/app/(app)/{dashboard,account,reward,masukkan-kode}/` and `src/app/auth/{login,register}/`.

## Auth Middleware

`src/middleware.ts` protects `/dashboard`, `/account`, `/reward`, `/masukkan-kode` (and their rewrite targets). Redirects authenticated users away from `/auth/*` and the landing page.

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

## Conventions

- **Styling:** SCSS Modules (`.module.scss`) for component styles; Tailwind utility classes in globals; theme tokens in `src/components/theme/_tokens.scss`
- **Supabase RPCs in use:** `pair_user_with_machine(p_session_code)`, `refresh_session_expiry(p_machine_id)`
- **IoT firmware** (`IOT/src/main.cpp`) calls Supabase REST API directly with the anon publishable key (not Edge Functions — tutorial exists at `CLOUD_COMPUTING_TUTORIAL.md`)
- **`.env.local` is committed** (contains Supabase project URL + publishable key)
