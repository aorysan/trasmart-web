# TrasMart — AGENTS.md

## Commands

- `npm run dev` — Next.js 16 dev server
- `npm run build` — production build
- `npm run start` — start production server (after `build`)
- `npm run lint` — ESLint 9 (flat config, `eslint.config.mjs`)
- No test framework or test files exist
- No CI/CD (no `.github/workflows/`)

## Architecture

- **Framework:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4 + SCSS Modules
- **Auth:** Supabase SSR (`@supabase/ssr`) — 3 client variants in `src/lib/utils/supabase/`:
  - `client.ts` — browser singleton
  - `server.ts` — server component client
  - `middleware.ts` — middleware client
- **Path alias:** `@/*` maps to `./src/*`
- **Timezone:** All date/time ops use `Asia/Jakarta` (WIB)
- **Fonts:** Outfit + DM Sans from Google Fonts (declared in root `layout.tsx` as CSS variables `--font-outfit`, `--font-dm-sans`)
- **Icons:** `lucide-react` v1.8.0
- **Favicon:** `/icon.png`
- **Image domains allowed:** `img.icons8.com`
- **Remove console:** only in production (`next.config.ts`)

## Routing

App pages live in route groups:
- `src/app/(app)/{dashboard,account,reward}/` — authenticated pages
- `src/app/auth/{login,register,reset-password,callback}/` — auth pages

Route groups are reflected directly in URLs (`/dashboard`, `/account`, etc.). When adding new pages, just create the directory under the appropriate route group — no rewrite needed. Update `src/middleware.ts` entries if the page should be protected.

## Auth Middleware

`src/middleware.ts` protects `/dashboard`, `/account`, `/reward`. Redirects authenticated users away from `/auth/*` and landing page `/`. The middleware `config.matcher` excludes `_next/*`, images, favicon, and `/api/*`.

## Supabase RPCs in Use

| RPC | Where called |
|---|---|
| `pair_user_with_machine(p_session_code)` | `src/app/api/machines/pair/route.ts` |
| `refresh_session_expiry(p_machine_id)` | `src/app/api/machines/refresh/route.ts` + `IOT/src/main.cpp` |
| `get_reward_usage_counts()` | `src/lib/data/reward.ts` |
| `generate_machine_session(p_machine_id)` | `IOT/src/main.cpp` only |

## Key Directories

| Path | Purpose |
|---|---|
| `src/app/(app)/` | Authenticated app pages (dashboard, account, reward) with `AuthGuard` + `SidebarProvider` layout |
| `src/app/auth/` | Login, register, reset-password, OAuth callback |
| `src/app/api/machines/` | Machine pairing (`/pair`) and session refresh (`/refresh`) |
| `src/components/layout/` | AppSidebar, PageTopbar, NotificationBell, PairMachineModal |
| `src/components/theme/` | `_tokens.scss` (design tokens) |
| `src/contexts/` | UserContext, SidebarContext |
| `src/hooks/` | `useAuth`, `useRealtimeTransactions` |
| `src/lib/data/` | Business logic: dashboard, reward data |
| `src/lib/utils/supabase/` | Supabase client (browser), server, middleware |
| `src/types/` | Dashboard & reward type definitions |
| `IOT/` | **PlatformIO** ESP32 Arduino firmware (separate project) |

## IoT Firmware

- **Project:** PlatformIO, board `esp32doit-devkit-v1`, Arduino framework
- **Secrets:** `IOT/include/secrets.h` (gitignored) — contains `ssid`, `password`, `supabase_url`, `supabase_key`, `MACHINE_ID`, `CATEGORY_LOGAM`, `CATEGORY_PLASTIK`
- **Hardware pins:** Trig 5, Echo 18, Prox 19, Servo 13
- **LCD:** I2C at 0x27, 16×2
- **MQTT:** `broker.hivemq.com` (PubSubClient), topic `vending/data` and `vending/status`
- **Supabase access:** Direct REST API calls with the anon key (no Edge Functions)
- **Dependencies:** LiquidCrystal_I2C, ESP32Servo, PubSubClient

## Conventions

- **Styling:** SCSS Modules (`.module.scss`) for component styles; Tailwind utility classes in globals; theme tokens in `src/components/theme/_tokens.scss`
- **Imports:** Always use `@/*` path alias (`@/components/...`, `@/lib/...`, etc.)
- **`.env.local`** is gitignored (do NOT commit). Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (modern `sb_publishable_*` format, not legacy anon key)
- **No `date-fns` or `dayjs`** — use native `Intl` for date formatting in `Asia/Jakarta`
