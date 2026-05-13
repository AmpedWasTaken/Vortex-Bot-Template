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
- **Optional Next.js dashboard** for billing, analytics, or admin-only surfaces.

---

## Feature tour

| Area | What you get |
| --- | --- |
| 🧩 **Slash commands** | `src/commands` modules export a `command` object — no central switch statement. |
| ⚡ **Auto loaders** | Commands and events are imported dynamically from disk (works in `dist/` after build). |
| 🛡️ **Permissions** | `hasPermission()` blends Administrator / Manage Guild checks with env + per-guild role lists. |
| 🪵 **Logging** | Levels (`debug`, `info`, `warn`, `error`), metadata objects, optional Discord log channel. |
| 🗄️ **Persistence** | Per-guild settings document with Mongo + SQLite + mock parity. |
| 🐳 **Docker** | Multi-stage image + Compose wiring for MongoDB. |
| 🖥️ **Dashboard** | `dashboard/` Next.js 15 starter with a premium dark landing stub. |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js 20+ (LTS aligned) |
| Language | TypeScript (`strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) |
| Discord SDK | `discord.js` v14 |
| Config | `dotenv` + typed accessors in `src/config` |
| Database | `mongoose` (MongoDB) + `better-sqlite3` (embedded fallback) + in-memory mock |
| Tooling | ESLint 9 (flat config) + Prettier |
| Optional UI | Next.js 15 + React 19 (`dashboard/`) |

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
│   ├── services/                 # Logger, guild settings, SQLite helpers
│   ├── models/                   # Mongoose schemas
│   ├── context/                  # Request-scoped bot context accessors
│   ├── config/                   # Typed environment configuration
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
> 2. Enable the **Server Members Intent** if you rely on `guildMemberAdd` / member permission hydration.
> 3. Invite the bot with `applications.commands` + `bot` scopes.

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
```

### Slash command registration strategies

| Mode | When to use |
| --- | --- |
| `DISCORD_GUILD_ID` set | Instant guild command updates (ideal for dev/staging). |
| `REGISTER_SLASH_ON_READY=true` | Force global/guild sync whenever the bot starts. |
| `npm run register-commands` | One-shot REST registration — best for production CI/CD. |

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | `tsx` watch mode for rapid iteration |
| `npm run build` | Emit `dist/` with `tsc` |
| `npm start` | Run compiled bot (`node dist/index.js`) |
| `npm run register-commands` | Push slash definitions to Discord |
| `npm run lint` / `npm run format` | Static analysis + Prettier |

---

## Database modes

| `DATABASE_MODE` | Behavior |
| --- | --- |
| `mongo` | Persists guild settings in MongoDB via Mongoose (`src/models/GuildSettings.ts`). |
| `sqlite` | Embedded `better-sqlite3` store under `SQLITE_PATH` (great for single-node SaaS tenants). |
| `mock` | In-memory `Map` — perfect for CI, prototyping, or local UI work without infra. |

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

| Command | Description |
| --- | --- |
| `/ping latency` | Shows gateway ping (subcommand demo). |
| `/ping echo` | Echoes a string option (modal-less interaction demo). |
| `/vortex about` | Prints runtime + database mode metadata. |

Add new commands by cloning `examples/ping-command.example.ts` into `src/commands/` and re-running `npm run register-commands` (or rely on guild-scoped auto registration during development).

---

## Optional Next.js dashboard

```bash
cd dashboard
npm install
npm run dev
```

The dashboard intentionally ships as a **thin, futuristic shell** so you can wire your own API routes, auth, and billing without fighting the bot runtime.

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
