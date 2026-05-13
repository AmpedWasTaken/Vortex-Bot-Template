<div align="center">

# Vortex Bot Template

**A production-grade Discord.js v14 starter for monetizable bots, SaaS control planes, and advanced community products.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

Vortex is not a toy ping bot. It is an **opinionated framework layout** with strict TypeScript, modular slash commands, auto-wired events, pluggable persistence (MongoDB, SQLite, or mock), structured logging, Docker, and an optional Next.js dashboard scaffold for SaaS-style surfaces.

If you are shipping a bot with **paid tiers**, **multi-tenant guild settings**, or **long-lived operations**, Vortex gives you the skeleton maintainers expect from a serious open-source template.

---

## Highlights

- **Slash-first architecture** with auto discovery, subcommand support, and a dedicated registration CLI.
- **Event loader** that mirrors the command ergonomics — drop a file, it loads.
- **Permission tiers** (`admin`, `moderator`, `user`) layered on top of native Discord permissions.
- **Structured logging** with chalk-colored console output and optional Discord channel mirroring.
- **Database adapters** for MongoDB + Mongoose, embedded SQLite, or zero-dependency mock mode for CI.
- **Graceful shutdown** hooks that play nicely with PM2, Docker, and orchestrators.
- **Docker Compose** stack for the bot + MongoDB with health checks.
- **Optional Next.js dashboard** for billing, Stripe checkout/portal routes, bot telemetry ingest, and integration docs.

---

## Feature tour

| Area                   | What you get                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| 🧩 **Slash commands**  | `src/commands` modules export a `command` object — no central switch statement.                               |
| ⚡ **Auto loaders**    | Commands and events are imported dynamically from disk (works in `dist/` after build).                        |
| 🛡️ **Permissions**     | `hasPermission()` blends Administrator / Manage Guild checks with env + per-guild role lists.                 |
| 🪵 **Logging**         | Levels (`debug`, `info`, `warn`, `error`), metadata objects, optional Discord log channel.                    |
| 🗄️ **Persistence**     | Per-guild settings document with Mongo + SQLite + mock parity.                                                |
| 🐳 **Docker**          | Multi-stage image + Compose wiring for MongoDB.                                                               |
| 🖥️ **Dashboard**       | Next.js 15 control plane: billing (Stripe), bot telemetry ingest, integrations docs, mobile shell.            |
| 📊 **Polls + AutoMod** | `/poll` create/end, poll vote logging, and `autoModerationActionExecution` wiring with optional rule helpers. |

---

## Tech stack

| Layer       | Choice                                                                          |
| ----------- | ------------------------------------------------------------------------------- |
| Runtime     | Node.js 20+ (LTS aligned)                                                       |
| Language    | TypeScript (`strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) |
| Discord SDK | `discord.js` v14                                                                |
| Config      | `dotenv` + typed accessors in `src/config`                                      |
| Database    | `mongoose` (MongoDB) + `better-sqlite3` (embedded fallback) + in-memory mock    |
| Tooling     | ESLint 9 (flat config) + Prettier                                               |
| Optional UI | Next.js 15 + React 19 (`dashboard/`)                                            |

---

## Repository layout

```text
.
├── Dockerfile
├── docker-compose.yml
├── examples/
│   └── ping-command.example.ts   # Copy/paste starter for new commands
├── dashboard/                    # Optional Next.js SaaS dashboard scaffold
├── src/
│   ├── commands/                 # Slash command modules (export `command`)
│   ├── events/                   # Discord event modules (export `event`)
│   ├── handlers/                 # Command registry, execution, event wiring
│   ├── services/                 # Logger, guild settings, entitlements, AutoMod helpers, SQLite store
│   ├── models/                   # Mongoose schemas
│   ├── context/                  # Request-scoped bot context accessors
│   ├── config/                   # Typed environment configuration + gateway intent toggles
│   ├── utils/                    # Banner, shutdown, permissions helpers
│   ├── types/                    # Shared contracts (`BotCommand`, `BotEvent`, …)
│   └── index.ts                  # Bootstrap + graceful shutdown
├── package.json
├── tsconfig.json
└── README.md
```

---

## Quick start

```bash
git clone https://github.com/<your-org>/vortex-bot-template.git
cd vortex-bot-template
cp .env.example .env
# fill DISCORD_TOKEN + DISCORD_CLIENT_ID at minimum
npm install
npm run dev
```

> **Discord developer portal checklist**
>
> 1. Create an application, reset the bot token, and copy the **Application ID** (`DISCORD_CLIENT_ID`).
> 2. Under **Bot → Privileged Gateway Intents**, enable only what you turn on in `.env` (see the [Gateway intents](#gateway-intents) matrix — mismatches cause silent missing events or review friction).
> 3. Enable **Server Members Intent** if `INTENT_GUILD_MEMBERS=true` (member joins, `guildMemberAdd`, and member fetches for permission checks).
> 4. Enable **Message Content Intent** only if `INTENT_MESSAGE_CONTENT=true` (privileged; most bots do not need it).
> 5. Invite the bot with `applications.commands` + `bot` scopes. For **user-installable** apps, also configure **Installation Contexts** in the portal and read [Installation contexts & command scope](#installation-contexts--command-scope).

---

## Environment variables

Copy `.env.example` to `.env` and tune for your environment:

```env
# Core
NODE_ENV=development
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=

# Optional: restrict slash command registration to one guild (faster iteration)
# DISCORD_GUILD_ID=123456789012345678

# Database — pick one primary mode:
# mongo | sqlite | mock
DATABASE_MODE=mongo
MONGODB_URI=mongodb://127.0.0.1:27017/vortex_bot

# SQLite path when DATABASE_MODE=sqlite
SQLITE_PATH=./data/vortex.sqlite

# Logging
LOG_LEVEL=info
DISCORD_LOG_CHANNEL_ID=

# Slash commands: auto-register on ready for guild installs or when explicitly enabled
REGISTER_SLASH_ON_READY=false

# Permissions — comma-separated role IDs (optional; Administrator permission still counts as admin)
ADMIN_ROLE_IDS=
MOD_ROLE_IDS=

# Monetization — Application Entitlements
PREMIUM_SKU_IDS=
DEV_ENTITLEMENT_BYPASS=false

# Gateway intents — must match the Developer Portal (see README)
INTENT_GUILD_MEMBERS=true
INTENT_AUTOMOD_EXECUTION=true
INTENT_GUILD_MESSAGE_POLLS=true
INTENT_MESSAGE_CONTENT=false
```

### Installation contexts & command scope

Discord distinguishes **where the app can be installed** (guild vs user “Use Application”) from **where slash commands are registered** (per-guild vs global). This template keeps registration logic in one place:

| Concern                             | How Vortex handles it                                                                                                                                                                                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guild vs global REST body**       | If `DISCORD_GUILD_ID` is set, `registerSlashCommands` uses `applicationGuildCommands` (instant updates, guild-only installs). If it is empty, commands register globally via `applicationCommands` (up to ~1 hour propagation).                                                                     |
| **When commands sync**              | Same as before: `DISCORD_GUILD_ID` **or** `REGISTER_SLASH_ON_READY=true` on startup, otherwise run `npm run register-commands`.                                                                                                                                                                     |
| **User-installed / secondary apps** | Configure **Installation contexts** and linked applications in the [Developer Portal](https://discord.com/developers/applications). Each OAuth **application id** has its own command registration surface; use separate deployments or env files per client id if you ship a secondary linked app. |
| **Runtime context**                 | In discord.js v14+, inspect `interaction.context` / `interaction.authorizingIntegrationOwners` when you need to branch DM vs guild behavior for the same command tree.                                                                                                                              |

---

## Gateway intents

`src/config/intents.ts` maps `.env` toggles to `GatewayIntentBits` for `new Client({ intents })`. **`Guilds` is always requested** so the bot can resolve guild metadata.

| `.env` flag                       | `GatewayIntentBits`       | Used by this template                                                                                            |
| --------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `INTENT_GUILD_MEMBERS=true`       | `GuildMembers`            | `guildMemberAdd` event; `interaction.guild.members.fetch` in slash permission checks.                            |
| `INTENT_AUTOMOD_EXECUTION=true`   | `AutoModerationExecution` | `autoModerationActionExecution` event (community AutoMod analytics).                                             |
| `INTENT_GUILD_MESSAGE_POLLS=true` | `GuildMessagePolls`       | `messagePollVoteAdd` / `messagePollVoteRemove` (poll vote analytics).                                            |
| `INTENT_MESSAGE_CONTENT=true`     | `MessageContent`          | **Privileged.** Raw message body in message events — leave `false` unless you truly need non-slash message text. |

Keep these flags aligned with **Bot → Privileged Gateway Intents** in the Developer Portal. Discord may flag or disable bots that request privileged intents without using them.

### Slash command registration strategies

| Mode                           | When to use                                             |
| ------------------------------ | ------------------------------------------------------- |
| `DISCORD_GUILD_ID` set         | Instant guild command updates (ideal for dev/staging).  |
| `REGISTER_SLASH_ON_READY=true` | Force global/guild sync whenever the bot starts.        |
| `npm run register-commands`    | One-shot REST registration — best for production CI/CD. |

---

## Scripts

| Script                            | Purpose                                 |
| --------------------------------- | --------------------------------------- |
| `npm run dev`                     | `tsx` watch mode for rapid iteration    |
| `npm run build`                   | Emit `dist/` with `tsc`                 |
| `npm start`                       | Run compiled bot (`node dist/index.js`) |
| `npm run register-commands`       | Push slash definitions to Discord       |
| `npm run lint` / `npm run format` | Static analysis + Prettier              |

---

## Database modes

| `DATABASE_MODE` | Behavior                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------- |
| `mongo`         | Persists guild settings in MongoDB via Mongoose (`src/models/GuildSettings.ts`).          |
| `sqlite`        | Embedded `better-sqlite3` store under `SQLITE_PATH` (great for single-node SaaS tenants). |
| `mock`          | In-memory `Map` — perfect for CI, prototyping, or local UI work without infra.            |

---

## Docker workflow

```bash
cp .env.example .env
# populate DISCORD_TOKEN + DISCORD_CLIENT_ID (and optional guild id)
docker compose up --build
```

Compose brings up **MongoDB 7** with a health check and wires `MONGODB_URI` to the bot service automatically. Volumes persist database data across restarts.

To build the image alone:

```bash
docker build -t vortex-bot .
docker run --env-file .env vortex-bot
```

---

## Example slash commands

| Command                      | Description                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/ping latency`              | Shows gateway ping (subcommand demo).                                                                                 |
| `/ping echo`                 | Echoes a string option (modal-less interaction demo).                                                                 |
| `/vortex about`              | Prints runtime + database mode metadata.                                                                              |
| `/vortex components2`        | Ephemeral reply built with **Components v2** (`MessageFlags.IsComponentsV2` + top-level `Container` / `TextDisplay`). |
| `/poll create` / `/poll end` | Native **message polls** (`PollLayoutType.Default`) — moderator-gated showcase.                                       |
| `/premium status`            | Lists active SKU IDs on the interaction + configured `PREMIUM_SKU_IDS`.                                               |
| `/premium demo`              | Subcommand-level check using `interaction.entitlements` + your SKU list.                                              |
| `/vip`                       | Top-level example of `BotCommand.requiresPaidSkus` (handler gate before `execute`).                                   |

Add new commands by cloning `examples/ping-command.example.ts` into `src/commands/` and re-running `npm run register-commands` (or rely on guild-scoped auto registration during development).

---

## Monetization (Application Entitlements)

Vortex tracks **`entitlementCreate`**, **`entitlementUpdate`**, and **`entitlementDelete`** in `src/services/entitlements.ts`, normalizing each record to `{ id, skuId, userId, guildId, type, deleted, consumed, isActive }` for logs and future webhooks.

- Set **`PREMIUM_SKU_IDS`** (comma-separated snowflakes) to the SKU(s) you sell in the Discord Developer Portal.
- **`DEV_ENTITLEMENT_BYPASS=true`** (non-production only) lets you test `/vip` without live entitlements.
- **`interaction.entitlements`** is the source of truth for **slash gating**; the gateway cache is for observability and later HTTP flows.

---

## Optional Next.js dashboard

The `dashboard/` app is a **shadcn/ui + Tailwind v4** control plane with a **password gate** (JWT session cookie), **mobile navigation**, and first-class stubs for **Stripe billing** and **Discord entitlement telemetry**.

### What ships in the UI

| Route                     | Purpose                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/dashboard`              | Overview cards fed by the latest bot ingest (guild count, active entitlements).                                 |
| `/dashboard/telemetry`    | Entitlement table + ingest activity log.                                                                        |
| `/dashboard/billing`      | Discord SKU list (`DISCORD_PREMIUM_SKU_IDS`) + Stripe checkout / customer portal buttons when env vars are set. |
| `/dashboard/integrations` | How to wire `POST /api/integrations/bot-ingest` from the worker.                                                |
| `/dashboard/settings`     | Non-secret env coverage checklist.                                                                              |

### Bot ↔ dashboard bridge

1. Set **`BOT_INGEST_SECRET`** to the same random string in **`dashboard/.env.local`** and the worker **`.env`**.
2. Set **`DASHBOARD_INGEST_URL`** on the worker to your dashboard origin + `/api/integrations/bot-ingest`.
3. Restart the worker. On **`ready`** and after **entitlement** gateway events (debounced ~2s), the bot POSTs a JSON snapshot (`guildCount`, `premiumSkuIds`, `entitlements[]`, `nodeEnv`, `reason`).

The ingest handler stores data **in memory inside the Next.js Node process** — great for demos and single-instance hosts. For production, replace `dashboard/lib/bot-telemetry.ts` with Redis, Postgres, or an event bus.

### Local run

```bash
cd dashboard
cp .env.example .env.local
# set DASHBOARD_PASSWORD (8+ chars), DASHBOARD_SESSION_SECRET (32+ chars), optional BOT_INGEST_SECRET / Stripe keys
npm install
npm run dev
```

Open `http://localhost:3100` for the marketing landing, `/login` to authenticate, and `/dashboard` for the operator console.

If `next build` warns about **multiple lockfiles**, remove any stray `package-lock.json` in a **parent directory** of this repo (for example under your user profile). Next may otherwise infer the wrong workspace root. The dashboard pins `outputFileTracingRoot` to the `dashboard/` folder so routes resolve reliably.

---

## PM2 / process managers

`npm start` emits structured logs and listens for `SIGINT` / `SIGTERM`. A minimal PM2 ecosystem file:

```bash
pm2 start dist/index.js --name vortex-bot -i 1
```

Pair PM2 with Docker only if you know why you need both — Compose or Kubernetes already supervises the process.

---

## Contributing

1. Fork the repository and create a feature branch (`feat/<topic>`).
2. Run `npm run lint` before opening a pull request.
3. Prefer **conventional commits** (`feat:`, `fix:`, `chore:`, `docs:`) so the history stays readable.
4. Describe the motivation + testing notes in the PR body.

Please keep secrets out of Git — use `.env` locally and CI secret stores in automation.

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for full text.

---

## Acknowledgements

Built on top of the [`discord.js`](https://discord.js.org/) ecosystem and the persistence libraries (`mongoose`, `better-sqlite3`) commonly used in long-running Discord services.
