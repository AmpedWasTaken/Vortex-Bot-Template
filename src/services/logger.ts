import chalk from 'chalk';
import { EmbedBuilder, type Client } from 'discord.js';
import type { AppConfig } from '../config/index.js';
import type { ILogger } from '../types/index.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function formatTimestamp(): string {
  return new Date().toISOString();
}

function levelLabel(level: LogLevel): string {
  return level.toUpperCase().padEnd(5, ' ');
}

function colorize(level: LogLevel, text: string): string {
  switch (level) {
    case 'debug':
      return chalk.gray(text);
    case 'info':
      return chalk.cyan(text);
    case 'warn':
      return chalk.yellow(text);
    case 'error':
      return chalk.red.bold(text);
  }
}

function shouldLog(configured: LogLevel, message: LogLevel): boolean {
  return LEVEL_ORDER[message] >= LEVEL_ORDER[configured];
}

function serializeMeta(meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return '';
  try {
    return chalk.dim(` ${JSON.stringify(meta)}`);
  } catch {
    return chalk.dim(' [meta serialization failed]');
  }
}

/**
 * Colored console logger with optional Discord log channel mirroring.
 */
export class Logger implements ILogger {
  private readonly configuredLevel: LogLevel;
  private client: Client | null = null;
  private discordLogChannelId: string | undefined;

  constructor(private readonly config: AppConfig) {
    this.configuredLevel = config.logging.level;
    this.discordLogChannelId = config.logging.discordLogChannelId;
  }

  attachClient(client: Client, channelId?: string): void {
    this.client = client;
    if (channelId) {
      this.discordLogChannelId = channelId;
    } else if (this.config.logging.discordLogChannelId) {
      this.discordLogChannelId = this.config.logging.discordLogChannelId;
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.emit('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.emit('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.emit('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.emit('error', message, meta);
  }

  private emit(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!shouldLog(this.configuredLevel, level)) return;

    const line = `${chalk.dim(`[${formatTimestamp()}]`)} ${colorize(level, levelLabel(level))} ${message}${serializeMeta(meta)}`;
    switch (level) {
      case 'debug':
      case 'info':
        console.log(line);
        break;
      case 'warn':
        console.warn(line);
        break;
      case 'error':
        console.error(line);
        break;
    }

    void this.forwardToDiscord(level, message, meta);
  }

  private async forwardToDiscord(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    const client = this.client;
    const channelId = this.discordLogChannelId;
    if (!client || !channelId) return;
    if (level === 'debug' && this.config.isProduction) return;

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel?.isTextBased() || channel.isDMBased()) return;

      const embed = new EmbedBuilder()
        .setTitle(`Vortex · ${level.toUpperCase()}`)
        .setDescription(message.slice(0, 3800))
        .setColor(
          level === 'error' ? 0xef4444 : level === 'warn' ? 0xf59e0b : level === 'info' ? 0x22d3ee : 0x94a3b8,
        )
        .setTimestamp(new Date());

      if (meta && Object.keys(meta).length > 0) {
        const json = JSON.stringify(meta, null, 2).slice(0, 900);
        embed.addFields({ name: 'Context', value: `\`\`\`json\n${json}\n\`\`\`` });
      }

      await channel.send({ embeds: [embed] });
    } catch {
      // Avoid recursive logging failures
    }
  }
}

export function createLogger(config: AppConfig): Logger {
  return new Logger(config);
}
