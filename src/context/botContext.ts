import type { Client, REST } from 'discord.js';
import type { AppConfig } from '../config/index.js';
import type { EntitlementService } from '../services/entitlements.js';
import type { GuildSettingsService } from '../services/guildSettings.js';
import type { Logger } from '../services/logger.js';
import type { BotCommand } from '../types/index.js';

export interface BotContext {
  client: Client;
  config: AppConfig;
  logger: Logger;
  guildSettings: GuildSettingsService;
  entitlements: EntitlementService;
  commands: Map<string, BotCommand>;
  rest: REST;
  startedAt: number;
}

let context: BotContext | null = null;

export function setBotContext(next: BotContext): void {
  context = next;
}

export function getBotContext(): BotContext {
  if (!context) {
    throw new Error('BotContext has not been initialized yet.');
  }
  return context;
}

export function clearBotContext(): void {
  context = null;
}
