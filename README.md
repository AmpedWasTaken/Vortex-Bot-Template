<div align="center">

![Vortex Bot Template — Discord.js control plane](assets/vortex-banner.svg)

**A production-ready [Discord.js](https://discord.js.org/) v14 starter:** slash commands, monetization hooks, polls, AutoMod events, optional **Next.js dashboard** (Postgres, Stripe webhooks, operator API).

[![Node.js 20+](https://img.shields.io/badge/node-%3E%3D20.10-43853d?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Quick start](#-first-run-about-5-minutes) · [Dashboard](#-optional-dashboard-nextjs) · [Troubleshooting](#-troubleshooting) · [Layout](#-repository-layout)

</div>

---

## Why this template?

| You want…                                               | Vortex gives you…                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A **real project structure** (not one giant `index.js`) | Typed config, context, handlers, `src/commands` + `src/events` auto-loaders            |
| **Monetization** aligned with Discord                   | Entitlement service, `/vip` + `/premium` samples, gateway entitlement events           |
| **Modern Discord API** demos                            | Native polls (`/poll`), Components v2 (`/vortex components2`), AutoMod execution event |
| **Operator / SaaS surface**                             | Optional `dashboard/` with Postgres, Stripe webhooks, **Discord OAuth**, guild ingest mirror, bot telemetry ingest, API keys   |

---

## Table of contents

1. [First run (about 5 minutes)](#-first-run-about-5-minutes)
2. [Choose: bot only vs bot + dashboard](#-choose-bot-only-vs-bot--dashboard)
3. [Features at a glance](#-features-at-a-glance)
4. [Tech stack](#-tech-stack)
5. [Repository layout](#-repository-layout)
6. [Environment variables](#-environment-variables)
7. [Gateway intents](#-gateway-intents)
8. [Slash command registration](#-slash-command-registration)
9. [Scripts](#-scripts)
10. [Database modes](#-database-modes)
11. [Docker](#-docker)
12. [Example slash commands](#-example-slash-commands)
13. [Monetization (Entitlements)](#-monetization-application-entitlements)
14. [Optional dashboard (Next.js)](#-optional-dashboard-nextjs)
15. [PM2](#-pm2--process-managers)
16. [Troubleshooting](#-troubleshooting)
17. [Contributing](#-contributing)
18. [License & acknowledgements](#-license)

---

## First run (about 5 minutes)

### Prerequisites

- **[Node.js](https://nodejs.org/) 20.10+** and **npm**
- A **[Discord application](https://discord.com/developers/applications)** with a bot user and token
- _(Optional)_ [MongoDB](https://www.mongodb.com/) local or Atlas — or use `DATABASE_MODE=sqlite` / `mock`

### Steps

1. **Clone and enter the repo**

   ```bash
   git clone https://github.com/ampedwastaken/Vortex-Bot-Template.git
   cd Vortex-Bot-Template
   ```

2. **Create env file from the template**

   ```bash
   cp .env.example .env
   ```

3. **Fill the two required Discord values** in `.env`
   - `DISCORD_TOKEN` — Bot token (Developer Portal → Bot → Reset / copy token)
   - `DISCORD_CLIENT_ID` — Application ID (same portal, “Application ID”)

4. **Pick a database mode** (default in `.env.example` is `mongo`)
   - For **no database install**, set `DATABASE_MODE=mock` in `.env` for a quick try.
   - For **SQLite**, set `DATABASE_MODE=sqlite` (no Mongo needed).
   - For **MongoDB**, set `DATABASE_MODE=mongo` and `MONGODB_URI=...`.

5. **Install and run the bot**

   ```bash
   npm install
   npm run dev
   ```

6. **See slash commands in your server**
   - **Fastest:** set `DISCORD_GUILD_ID=<your server id>` in `.env`, then restart the bot _or_ run `npm run register-commands` so commands register to that guild immediately.
   - **Global commands:** leave `DISCORD_GUILD_ID` empty and run `npm run register-commands`; propagation can take up to ~1 hour.

7. **Portal checklist** (avoid “nothing works” surprises)
   - In **Bot → Privileged Gateway Intents**, match what you set in `.env` (see [Gateway intents](#-gateway-intents)).
   - Invite the bot with scopes **`bot`** + **`applications.commands`**.

---

## Choose: bot only vs bot + dashboard

| Goal                         | What to run                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discord bot only**         | Root: `npm run dev` (or `npm run build` + `npm start`)                                                                                                                 |
| **Bot + control plane UI**   | Also `cd dashboard`, copy `.env.local`, `npm install`, `npm run db:migrate` (if using Postgres), `npm run dev` — see [Optional dashboard](#-optional-dashboard-nextjs) |
| **Push slash commands once** | From root: `npm run register-commands`                                                                                                                                 |

---

## Features at a glance

| Area                   | What you get                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| **Slash commands**     | Drop files under `src/commands/` — no central switch. Subcommands, autocomplete-ready types.          |
| **Events**             | Same pattern under `src/events/` (ready, interactions, entitlements, polls, AutoMod, …).              |
| **Permissions**        | Tiers `admin` / `moderator` / `user` on top of Discord permissions + env/guild role lists.            |
| **Persistence**        | MongoDB (Mongoose), **SQLite**, or **mock** for CI / quick demos.                                     |
| **Logging**            | Structured logs + optional mirror to a Discord log channel.                                           |
| **Monetization**       | Entitlement cache + `/premium`, `/vip` patterns; dashboard ingest optional.                           |
| **Modern API samples** | `/poll`, `/vortex components2`, AutoMod execution event, poll vote events.                            |
| **Intents**            | Env-driven toggles in `src/config/intents.ts` (documented + README matrix).                           |
| **Dashboard**          | Password and/or **Discord OAuth**, telemetry, Stripe webhooks, **guild directory** ingest, Postgres, operator API keys. |
| **Deploy**             | Dockerfile + `docker-compose.yml` (bot + Mongo).                                                      |

---

## Tech stack

| Layer           | Choice                                                     |
| --------------- | ---------------------------------------------------------- |
| Runtime         | Node.js 20+                                                |
| Language        | TypeScript (strict)                                        |
| Discord         | discord.js v14                                             |
| Bot persistence | Mongoose / better-sqlite3 / mock                           |
| Dashboard DB    | Postgres (`postgres` driver) — optional                    |
| Dashboard UI    | Next.js 15, React 19, Tailwind v4, shadcn-style components |
| Tooling         | ESLint 9, Prettier                                         |

---

## Repository layout

```text
.
├── assets/
│   └── vortex-banner.svg          # README banner
├── dashboard/                     # Optional Next.js control plane
│   ├── Dockerfile                 # Production image (Next standalone)
│   ├── db/migrations/             # Postgres schema (control plane)
│   ├── app/                       # Routes + API (Stripe webhook, operator API, …)
│   └── scripts/                   # db:migrate, operator:create-key
├── examples/
│   └── ping-command.example.ts
├── src/
│   ├── commands/                  # Slash modules → export `command`
│   ├── events/                    # Gateway modules → export `event`
│   ├── handlers/
│   ├── services/                  # Logger, settings, entitlements, dashboard ingest, …
│   ├── config/                    # loadConfig + intent toggles
│   └── index.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

---

## Environment variables

Copy **`.env.example`** → **`.env`** at the repo root. The file is commented; minimum for the bot is:

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`

Optional highlights:

| Variable                                     | Purpose                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `DISCORD_GUILD_ID`                           | Guild-scoped slash commands (instant updates while developing).                      |
| `DATABASE_MODE`                              | `mongo` \| `sqlite` \| `mock`                                                        |
| `PREMIUM_SKU_IDS`                            | Discord SKU snowflakes for premium gating.                                           |
| `DASHBOARD_INGEST_URL` + `BOT_INGEST_SECRET` | Push entitlement snapshots to the dashboard (same secret in `dashboard/.env.local`). |
| `INTENT_*`                                   | Gateway intents — must match the Developer Portal.                                   |

Full list: see [`.env.example`](.env.example).

---

## Gateway intents

Configured in **`src/config/intents.ts`** from `.env`. **`Guilds` is always on.**

| `.env`                                        | Intent                    | Used for                                                   |
| --------------------------------------------- | ------------------------- | ---------------------------------------------------------- |
| `INTENT_GUILD_MEMBERS` (default `true`)       | `GuildMembers`            | `guildMemberAdd`, member fetch for slash permission checks |
| `INTENT_AUTOMOD_EXECUTION` (default `true`)   | `AutoModerationExecution` | `autoModerationActionExecution`                            |
| `INTENT_GUILD_MESSAGE_POLLS` (default `true`) | `GuildMessagePolls`       | Poll vote add/remove events                                |
| `INTENT_MESSAGE_CONTENT` (default `false`)    | `MessageContent`          | **Privileged** — raw message content                       |

Enable the same toggles under **Bot → Privileged Gateway Intents** in the [Developer Portal](https://discord.com/developers/applications).

---

## Slash command registration

| Approach                       | When to use                                                       |
| ------------------------------ | ----------------------------------------------------------------- |
| `DISCORD_GUILD_ID` set         | Guild commands; updates are quick (great for dev).                |
| `REGISTER_SLASH_ON_READY=true` | Sync on every bot start (guild or global depending on `guildId`). |
| `npm run register-commands`    | One-shot from your machine or CI.                                 |

### Installation contexts (guild vs user installs)

| Topic                | Behavior in this repo                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Guild vs global REST | If `DISCORD_GUILD_ID` is set → `applicationGuildCommands`; else → `applicationCommands`.                                   |
| User-installed apps  | Configure **Installation contexts** in the Developer Portal; use separate app IDs/envs if you ship a linked/secondary app. |
| Runtime              | Use `interaction.context` / `interaction.authorizingIntegrationOwners` when you branch DM vs guild.                        |

---

## Scripts

| Script                            | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `npm run dev`                     | Watch mode (`tsx`)                   |
| `npm run build`                   | Compile to `dist/`                   |
| `npm start`                       | Run `dist/index.js`                  |
| `npm run register-commands`       | Register slash commands with Discord |
| `npm run lint` / `npm run format` | ESLint / Prettier                    |

---

## Database modes

| `DATABASE_MODE` | When to use                                                         |
| --------------- | ------------------------------------------------------------------- |
| `mongo`         | Production-style multi-tenant guild settings (needs `MONGODB_URI`). |
| `sqlite`        | Single-node / embedded (`SQLITE_PATH`).                             |
| `mock`          | CI or “just try the bot” without installing a database.             |

---

## Docker

### Bot + Mongo only (minimal)

```bash
cp .env.example .env
# set DISCORD_TOKEN, DISCORD_CLIENT_ID, and DATABASE if needed
docker compose up --build mongo bot
```

This starts **MongoDB 7** and the **bot** (same as earlier template behavior). To build only the bot image: `docker build -t vortex-bot .`

### Full stack: bot + Mongo + Postgres + dashboard

Compose can run the **Next.js control plane** next to the worker. Services: `mongo`, `postgres`, `dashboard` (Next standalone on port **3100**), `dashboard-migrate` (one-off helper), and `bot` (points ingest at `http://dashboard:3100/api/integrations/bot-ingest` by default).

1. Copy env and set **`DISCORD_TOKEN`** / **`DISCORD_CLIENT_ID`** in `.env` (same as local dev).
2. **Apply Postgres migrations once** (creates ingest + Stripe tables):

   ```bash
   docker compose up -d postgres
   docker compose run --rm dashboard-migrate
   ```

3. Start everything:

   ```bash
   docker compose up --build -d
   ```

4. Open **http://localhost:3100/login** — default compose uses **`DASHBOARD_PASSWORD`** / **`DASHBOARD_SESSION_SECRET`** / **`BOT_INGEST_SECRET`** (override all three in `.env` for anything beyond local demos).

**OAuth in Docker:** register redirect **`http://localhost:3100/api/auth/discord/callback`** (or your public URL) in the Discord Developer Portal and set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_OAUTH_REDIRECT_URI`, and `DASHBOARD_AUTH_MODES=password,discord` in the environment for the `dashboard` service (see [`dashboard/.env.example`](dashboard/.env.example)).

If root **`.env`** defines **`BOT_INGEST_SECRET`**, it overrides the compose default so the bot and dashboard stay aligned.

---

## Example slash commands

| Command                             | Description                                                |
| ----------------------------------- | ---------------------------------------------------------- |
| `/ping latency` / `/ping echo`      | Subcommands + options demo                                 |
| `/vortex about`                     | Runtime / DB mode                                          |
| `/vortex components2`               | **Components v2** (top-level container + `IsComponentsV2`) |
| `/poll create` / `/poll end`        | Native Discord polls                                       |
| `/premium status` / `/premium demo` | Entitlements vs configured SKUs                            |
| `/vip`                              | `requiresPaidSkus` gate example                            |

Add commands by copying `examples/ping-command.example.ts` into `src/commands/`, then register (guild env or `npm run register-commands`).

---

## Monetization (Application Entitlements)

- Gateway: `entitlementCreate`, `entitlementUpdate`, `entitlementDelete` → `src/services/entitlements.ts`.
- Set **`PREMIUM_SKU_IDS`** to your Discord SKU snowflakes.
- **`DEV_ENTITLEMENT_BYPASS=true`** — **development only**; bypasses premium checks for testing.
- Slash gating uses **`interaction.entitlements`** (authoritative for that interaction).

---

## Optional dashboard (Next.js)

Auth modes are controlled by **`DASHBOARD_AUTH_MODES`** in `dashboard/.env.local` (comma-separated):

- **`password`** — shared password (demo / staging).
- **`discord`** — Discord OAuth2 (`identify` by default; add **`guilds`** in `DISCORD_OAUTH_SCOPES` when using the bot-guild-owner gate). Optional gates: **`DASHBOARD_DISCORD_USER_IDS`**, **`DASHBOARD_DISCORD_REQUIRE_BOT_GUILD_OWNER`**, **`DASHBOARD_ACCESS_GUILD_ID`** + **`DASHBOARD_ACCESS_ROLE_IDS`** (requires **`DISCORD_BOT_TOKEN`** on the dashboard for REST checks).

Password-protected or Discord-signed-in UI under `dashboard/` — billing, telemetry, guild mirror, integrations, settings.

### UI routes

| Route                         | Purpose                                                                 |
| ----------------------------- | ------------------------------------------------------------------------- |
| `/login`                      | Password and/or **Continue with Discord** (see auth modes above).         |
| `/dashboard`                  | Overview (ingest snapshot, guild count, active entitlements).           |
| `/dashboard/guilds`           | Guild directory from latest ingest (capped).                             |
| `/dashboard/guilds/[id]`     | Read-only settings mirror + entitlements for one guild.                  |
| `/dashboard/telemetry`        | Entitlement rows + activity.                                             |
| `/dashboard/billing`          | SKUs, Stripe checkout / portal, webhook notes.                           |
| `/dashboard/integrations`     | Ingest, Postgres, Stripe webhook, operator `curl` examples.              |
| `/dashboard/settings`         | Which env vars are set (no secret values).                               |

### Postgres control plane (recommended for real deploys)

Set **`CONTROL_PLANE_DATABASE_URL`** in `dashboard/.env.local`, then from `dashboard/`:

```bash
npm run db:migrate
npm run operator:create-key -- "my-machine"   # prints API key once; default scope telemetry:read
```

Stores: ingest snapshots, `audit_log`, Stripe webhook dedupe (`stripe_webhook_events`), `fulfillment_records`, hashed **operator API keys**.

Without Postgres, telemetry falls back to **in-memory** (OK for a single local process only).

### Stripe

- **`POST /api/webhooks/stripe`** — requires Postgres + `STRIPE_WEBHOOK_SECRET`; idempotent by Stripe `event.id`.
- Handlers: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` — extend `dashboard/lib/fulfillment-stripe.ts` for Discord REST.
- Checkout session metadata (allowlisted): `discord_user_id`, `discord_guild_id`, `sku_id` — send JSON body from an authenticated client to `/api/billing/checkout` if you need them.

### Operator API

| Endpoint                         | Auth                                   |
| -------------------------------- | -------------------------------------- |
| `GET /api/operator/v1/health`    | `Authorization: Bearer <operator-key>` |
| `GET /api/operator/v1/telemetry` | Same + scope `telemetry:read`          |

### Bot → dashboard ingest

1. Same **`BOT_INGEST_SECRET`** in root `.env` and `dashboard/.env.local`.
2. **`DASHBOARD_INGEST_URL`** on the bot = your dashboard base + `/api/integrations/bot-ingest`.
3. Worker sends JSON on **ready** and after entitlement changes (debounced): guild count, premium SKU ids, entitlement rows, **guild directory** (id, name, icon; capped at 200), and **per-guild settings** mirrors (`modRoleIds`, `adminRoleIds`, `logChannelId`).

### Run the dashboard locally

```bash
cd dashboard
cp .env.example .env.local
# DASHBOARD_AUTH_MODES=password          # or password,discord — see README
# DASHBOARD_PASSWORD (8+ chars), DASHBOARD_SESSION_SECRET (32+ chars)
# Set CONTROL_PLANE_DATABASE_URL in .env.local when using Postgres (required for db:migrate + ingest)
# optional: BOT_INGEST_SECRET, Discord OAuth vars, Stripe keys, STRIPE_WEBHOOK_SECRET
npm install
npm run db:migrate    # requires CONTROL_PLANE_DATABASE_URL; skip if not using Postgres
npm run dev           # http://localhost:3100
```

**Build note:** If `next build` warns about **multiple lockfiles**, remove stray `package-lock.json` files in **parent folders** of this repo (e.g. under your user profile). The dashboard sets `outputFileTracingRoot` to the `dashboard/` folder for stable route resolution.

---

## PM2 / process managers

```bash
npm run build
pm2 start dist/index.js --name vortex-bot -i 1
```

The bot handles `SIGINT` / `SIGTERM` for clean shutdown.

---

## Troubleshooting

| Symptom                                   | What to check                                                                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Slash commands never appear**           | Set `DISCORD_GUILD_ID` and restart, or run `npm run register-commands`. Wait up to ~1h for global commands. Ensure invite includes `applications.commands`. |
| **`npm run dev` errors on Mongo**         | Set `DATABASE_MODE=sqlite` or `mock`, or install Mongo and set `MONGODB_URI`.                                                                               |
| **Member join / permission fetch issues** | `INTENT_GUILD_MEMBERS` + portal “Server Members Intent” must both match.                                                                                    |
| **Poll vote / AutoMod events missing**    | Matching `INTENT_*` flags and portal toggles for polls / AutoMod.                                                                                           |
| **Dashboard `next build` fails**          | Stray `package-lock.json` above the repo; use Node 20+.                                                                                                     |
| **Stripe webhook returns 503**            | Set `CONTROL_PLANE_DATABASE_URL` and run `npm run db:migrate` in `dashboard/`.                                                                              |
| **Ingest 401**                            | Same `BOT_INGEST_SECRET` in bot `.env` and `dashboard/.env.local`; URL must end with `/api/integrations/bot-ingest`.                                        |
| **Postgres `password authentication failed` (28P01)** | Your `CONTROL_PLANE_DATABASE_URL` does not match the server on `localhost:5432`. Another Postgres may own that port, or credentials differ. Use the real user/password/DB, or start this repo’s `postgres` service from `docker compose` and match its `POSTGRES_*` values. |

---

## Contributing

1. Fork and branch (`feat/...` / `fix/...`).
2. Run **`npm run lint`** (and `cd dashboard && npm run lint` if you touched the dashboard).
3. Use **conventional commits** (`feat:`, `fix:`, `docs:`).
4. Do not commit secrets — use `.env` / CI secrets.

**GitHub discoverability:** In the repo **About** box, add topics such as `discord`, `discord-js`, `typescript`, `bot-framework`, `nextjs`, `stripe`, `postgresql`, `mongodb`, `docker`, `opensource`.

---

## License

[MIT License](LICENSE).

---

## Acknowledgements

Built with [discord.js](https://discord.js.org/), [mongoose](https://mongoosejs.com/), [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), and [Next.js](https://nextjs.org/).
