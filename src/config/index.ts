import 'dotenv/config';

export type NodeEnv = 'development' | 'production' | 'test';
export type DatabaseMode = 'mongo' | 'sqlite' | 'mock';

export interface AppConfig {
  nodeEnv: NodeEnv;
  isProduction: boolean;
  discord: {
    token: string;
    clientId: string;
    /** When set, slash commands register to this guild only (instant). */
    guildId?: string;
  };
  database: {
    mode: DatabaseMode;
    mongoUri?: string;
    sqlitePath: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    discordLogChannelId?: string;
  };
  permissions: {
    adminRoleIds: string[];
    modRoleIds: string[];
  };
}

function parseList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseLogLevel(raw: string | undefined): AppConfig['logging']['level'] {
  const v = raw?.toLowerCase();
  if (v === 'debug' || v === 'info' || v === 'warn' || v === 'error') return v;
  return 'info';
}

function parseDatabaseMode(raw: string | undefined): DatabaseMode {
  const v = raw?.toLowerCase();
  if (v === 'mongo' || v === 'sqlite' || v === 'mock') return v;
  return 'mongo';
}

function parseNodeEnv(raw: string | undefined): NodeEnv {
  if (raw === 'production' || raw === 'test' || raw === 'development') return raw;
  return 'development';
}

function nonEmptyTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

/**
 * Loads configuration from environment variables.
 * Does not validate Discord credentials — use `assertDiscordConfig` before login.
 */
export function loadConfig(): AppConfig {
  const nodeEnv = parseNodeEnv(process.env['NODE_ENV']);
  const databaseMode = parseDatabaseMode(process.env['DATABASE_MODE']);

  const discord: AppConfig['discord'] = {
    token: process.env['DISCORD_TOKEN'] ?? '',
    clientId: process.env['DISCORD_CLIENT_ID'] ?? '',
  };
  const guildId = process.env['DISCORD_GUILD_ID']?.trim();
  if (guildId) {
    discord.guildId = guildId;
  }

  const database: AppConfig['database'] = {
    mode: databaseMode,
    sqlitePath: nonEmptyTrimmed(process.env['SQLITE_PATH']) ?? './data/vortex.sqlite',
  };
  const mongoUri = process.env['MONGODB_URI']?.trim();
  if (mongoUri) {
    database.mongoUri = mongoUri;
  }

  const logging: AppConfig['logging'] = {
    level: parseLogLevel(process.env['LOG_LEVEL']),
  };
  const discordLogChannelId = process.env['DISCORD_LOG_CHANNEL_ID']?.trim();
  if (discordLogChannelId) {
    logging.discordLogChannelId = discordLogChannelId;
  }

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    discord,
    database,
    logging,
    permissions: {
      adminRoleIds: parseList(process.env['ADMIN_ROLE_IDS']),
      modRoleIds: parseList(process.env['MOD_ROLE_IDS']),
    },
  };
}

export function assertDiscordConfig(config: AppConfig): void {
  if (!config.discord.token) {
    throw new Error('DISCORD_TOKEN is required to start the bot.');
  }
  if (!config.discord.clientId) {
    throw new Error('DISCORD_CLIENT_ID is required for slash command registration.');
  }
}

export function assertDatabaseConfig(config: AppConfig): void {
  if (config.database.mode === 'mongo') {
    if (!config.database.mongoUri) {
      throw new Error('MONGODB_URI is required when DATABASE_MODE=mongo.');
    }
  }
}
