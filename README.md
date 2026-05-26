# TrasMart — Ubah Sampah Jadi Poin

[Next.js](https://nextjs.org/)
[React](https://react.dev/)
[Supabase](https://supabase.com/)
[Tailwind CSS](https://tailwindcss.com/)
[PlatformIO](https://platformio.org/)

**TrasMart** is a smart waste-recycling incentive platform that connects physical recycling machines with a web-based point-reward system. Students at State Polytechnic of Malang (Polinema) can deposit recyclable bottles and cans into IoT-enabled machines, earn points, and redeem rewards through the web app — turning everyday recycling into tangible value.

---

## Key Features


| Feature                | Description                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **Landing Page**       | Informative homepage with stats, benefits, and onboarding                                 |
| **Authentication**     | Email/password login & registration, plus OAuth via Google and GitHub                     |
| **Points Dashboard**   | View balance, next reward target, point activity chart, transaction history               |
| **Reward Shop**        | Browse reward catalog, filter by category, redeem points for rewards                      |
| **Account Management** | Edit profile, view point summary, quick logout                                            |
| **Machine Pairing**    | Generate a session code on the physical machine and pair it with your account via the web |
| **Route Protection**   | Middleware ensures only authenticated users access dashboard, rewards, and account pages  |


---

## System Architecture

```
┌──────────────────────────┐       ┌──────────────────────────┐
│                          │       │                          │
│    Web Application       │       │    IoT Machine (ESP32)   │
│    Next.js 16 App Router │◄─────►│    PlatformIO / Arduino  │
│    React 19 / TypeScript │       │    - Ultrasonic Sensor   │
│    Supabase SSR Auth     │       │    - Inductive Proximity │
│    Tailwind CSS v4       │       │    - Servo Motor         │
│    SCSS Modules          │       │    - LCD 16x2 I2C        │
│                          │       │    - MQTT (HiveMQ)       │
│                          │       │                          │
└──────────┬───────────────┘       └──────────┬───────────────┘
           │                                  │
           └──────────────┬───────────────────┘
                          │
                ┌─────────▼─────────┐
                │                   │
                │    Supabase       │
                │  (Database, Auth, │
                │   Realtime, RPC)  │
                │                   │
                └───────────────────┘
```

The web app connects to Supabase for authentication, database, and server-side logic. IoT machines interact with Supabase directly via REST API (no Edge Functions) to manage sessions, create transactions, and refresh session expiry. MQTT publishes machine status to `vending/status` and `vending/data` topics.

---

## Tech Stack

### Web Application


| Technology                               | Purpose                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Next.js 16 (App Router)                  | Full-stack React framework with SSR, API routes, and middleware         |
| React 19                                 | UI components                                                           |
| TypeScript 5                             | Type safety                                                             |
| Supabase SSR (`@supabase/ssr`)           | Authentication & database client (browser, server, middleware variants) |
| Tailwind CSS v4 + `@tailwindcss/postcss` | Utility-first CSS                                                       |
| SCSS Modules                             | Component-level styling with design tokens                              |
| `lucide-react`                           | Icon library                                                            |
| `tailwind-merge`                         | Tailwind class conflict resolution                                      |


### IoT Firmware


| Component                  | Detail                                                  |
| -------------------------- | ------------------------------------------------------- |
| Microcontroller            | ESP32 (ESP32 DOIT DevKit V1)                            |
| Framework                  | Arduino (PlatformIO)                                    |
| Ultrasonic Sensor          | HC-SR04 (Trig GPIO 5, Echo GPIO 18)                     |
| Inductive Proximity Sensor | LJ12A3-4-Z/BX (GPIO 19)                                 |
| Servo Motor                | SG90 (GPIO 13)                                          |
| LCD                        | 16×2 I2C (address `0x27`)                               |
| Connectivity               | WiFi + MQTT via `broker.hivemq.com`                     |
| Communication              | PubSubClient for MQTT, HTTPClient for Supabase REST API |


---

## Web Application — Pages


| Route                  | Page           | Description                                                                                   |
| ---------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `/`                    | Landing        | Hero, stats, feature highlights, CTA                                                          |
| `/auth/login`          | Login          | Email/password + OAuth (Google, GitHub)                                                       |
| `/auth/register`       | Register       | New account creation                                                                          |
| `/auth/reset-password` | Reset Password | Password recovery flow                                                                        |
| `/auth/callback`       | OAuth Callback | Handles OAuth redirects                                                                       |
| `/dashboard`           | Dashboard      | Point balance, activity chart, transaction history, machine status, and machine pairing modal |
| `/reward`              | Reward Shop    | Reward catalog with category filter, point redemption                                         |
| `/account`             | Account        | Profile editing, point summary, logout                                                        |


### Authentication Flow

- Unauthenticated users are redirected to `/auth/login` when accessing protected routes.
- Authenticated users visiting `/auth/*` or `/` are redirected to `/dashboard`.
- Middleware (`src/middleware.ts`) handles route protection server-side.

---

## IoT Machine — How It Works

1. **Session Generation** — On boot, the machine calls Supabase RPC `generate_machine_session()` to obtain a unique session code displayed on the LCD.
2. **Machine Pairing** — The user enters this code in the pairing modal on the dashboard, which calls `pair_user_with_machine()` to link the machine to their account.
3. **Deposit Detection** — When an object is detected within 10 cm of the ultrasonic sensor, the machine checks for metal using the inductive proximity sensor (5-second window).
4. **Reward Calculation**:
  - Metal detected → `+15 points` (category: logam)
  - No metal → `+10 points` (category: plastik)
5. **Transaction Recording** — The machine POSTs the transaction to Supabase `transactions` table and refreshes the session expiry via `refresh_session_expiry()`.
6. **Servo Activation** — The servo opens the appropriate bin (0° for plastic, 180° for metal).
7. **MQTT Status** — Machine publishes events to `vending/data` and status to `vending/status`.

---

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (app)/              # Authenticated pages with sidebar layout
│   │   │   ├── dashboard/
│   │   │   ├── account/
│   │   │   └── reward/
│   │   ├── auth/               # Login, register, reset-password, callback
│   │   └── api/machines/       # Pair & refresh API routes
│   ├── components/
│   │   ├── layout/             # AppSidebar, PageTopbar, NotificationBell, PairMachineModal
│   │   └── theme/              # Design tokens (_tokens.scss)
│   ├── contexts/               # UserContext, SidebarContext, themeContext
│   ├── hooks/                  # useAuth, useGoback, useRealtimeTransactions
│   ├── lib/
│   │   ├── data/               # Dashboard & reward business logic
│   │   └── utils/supabase/     # Server, client, middleware Supabase wrappers
│   ├── types/                  # TypeScript type definitions
│   └── middleware.ts           # Route protection middleware
├── IOT/
│   ├── src/main.cpp            # ESP32 firmware
│   ├── include/secrets.h       # WiFi & Supabase credentials (gitignored)
│   ├── platformio.ini          # PlatformIO project config
│   └── lib/                    # PlatformIO library dependencies
├── next.config.ts              # Image domains, console removal (production)
├── eslint.config.mjs           # ESLint 9 flat config
├── postcss.config.mjs          # PostCSS with @tailwindcss/postcss
└── tsconfig.json               # TypeScript config with @/* path alias
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Supabase project (free tier works)
- PlatformIO (for IoT firmware deployment)

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

### Web App

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
npm run start

# Lint
npm run lint
```

### IoT Firmware

1. Install PlatformIO (CLI or VS Code extension).
2. Copy `IOT/include/secrets.example.h` (create from template) to `IOT/include/secrets.h` and fill in WiFi credentials, Supabase URL, Supabase key, and machine ID.
3. Flash to ESP32:

```bash
cd IOT
pio run --target upload
pio device monitor
```

> **Note:** `IOT/include/secrets.h` is gitignored to protect credentials.

---

## Supabase Database RPCs


| RPC                                      | Description                              | Called From     |
| ---------------------------------------- | ---------------------------------------- | --------------- |
| `generate_machine_session(p_machine_id)` | Creates a new session code for a machine | IoT firmware    |
| `pair_user_with_machine(p_session_code)` | Pairs authenticated user with a machine  | Web API route   |
| `refresh_session_expiry(p_machine_id)`   | Extends the current session timeout      | Web API + IoT   |
| `get_reward_usage_counts()`              | Returns usage statistics for rewards     | Web reward data |


---

## License

This project is developed for educational purposes as part of the Politeknik Negeri Malang (Polinema) curriculum.