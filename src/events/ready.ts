import { ActivityType, Events } from 'discord.js';
import type { Client } from 'discord.js';
import { getBotContext } from '../context/botContext.js';
import { registerSlashCommands } from '../handlers/commandHandler.js';
import { flushDashboardIngestNow } from '../services/dashboardIngest.js';
import type { BotEvent } from '../types/index.js';

export const event: BotEvent<typeof Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client<true>) {
    const { logger, config, commands, rest, startedAt } = getBotContext();
    const startupMs = Math.round(performance.now() - startedAt);

    logger.attachClient(client, config.logging.discordLogChannelId);

    const shouldRegister =
      Boolean(config.discord.guildId) || process.env['REGISTER_SLASH_ON_READY'] === 'true';

    if (shouldRegister) {
      await registerSlashCommands(rest, config, commands);
      logger.info('Slash commands synchronized with Discord', {
        scope: config.discord.guildId ? 'guild' : 'global',
      });
    } else {
      logger.warn(
        'Skipping automatic slash registration. Set DISCORD_GUILD_ID or REGISTER_SLASH_ON_READY=true, or run npm run register-commands.',
      );
    }

    client.user.setActivity('Vortex Template', { type: ActivityType.Watching });

    logger.info(`Ready as ${client.user.tag}`, {
      guilds: client.guilds.cache.size,
      startupMs,
    });

    await flushDashboardIngestNow('client_ready');
  },
};
