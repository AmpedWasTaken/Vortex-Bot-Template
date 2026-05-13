import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { AppConfig } from '../config/index.js';
import type { EntitlementService } from '../services/entitlements.js';

/** Permission tier required to run a command (checked after Discord built-ins). */
export type PermissionLevel = 'admin' | 'moderator' | 'user';

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder;

export interface GuildSettingsDoc {
  guildId: string;
  modRoleIds: string[];
  adminRoleIds: string[];
  logChannelId?: string;
}

export interface IGuildSettingsService {
  getOrCreate(guildId: string): Promise<GuildSettingsDoc>;
}

export interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  attachClient(client: Client, channelId?: string): void;
}

export interface CommandContext {
  client: Client;
  config: AppConfig;
  logger: ILogger;
  guildSettings: IGuildSettingsService;
  entitlements: EntitlementService;
}

export interface BotCommand {
  /** Slash command definition (supports subcommands). */
  data: SlashCommandData;
  /** Minimum Vortex permission level (default: user). */
  requiredPermission?: PermissionLevel;
  /**
   * When true, requires an active entitlement for one of `config.monetization.premiumSkuIds`
   * on this interaction (or `DEV_ENTITLEMENT_BYPASS` in non-production).
   */
  requiresPaidSkus?: boolean;
  /** Cooldown in seconds per user (optional future use). */
  cooldownSeconds?: number;
  execute(interaction: ChatInputCommandInteraction, ctx: CommandContext): Promise<void>;
  autocomplete?: (
    interaction: AutocompleteInteraction,
    ctx: CommandContext,
  ) => Promise<void>;
}

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void> | void;
}
