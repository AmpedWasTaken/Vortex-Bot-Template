import { performance } from 'node:perf_hooks';
import { Client, REST } from 'discord.js';
import { assertDatabaseConfig, assertDiscordConfig, loadConfig } from './config/index.js';
import { resolveGatewayIntents } from './config/intents.js';
import { clearBotContext, setBotContext } from './context/botContext.js';
import {
  eventsDirectory,
  loadEventsFromDirectory,
  registerEvents,
} from './handlers/eventLoader.js';
import { commandsDirectory, loadCommandsFromDirectory } from './handlers/commandRegistry.js';
import { createEntitlementService } from './services/entitlements.js';
import { createGuildSettingsService } from './services/guildSettings.js';
import { createLogger } from './services/logger.js';
import { printBanner } from './utils/banner.js';
import { registerGracefulShutdown } from './utils/shutdown.js';

async function bootstrap(): Promise<void> {
  const startedAt = performance.now();
  printBanner();
  const config = loadConfig();
  const logger = createLogger(config);
  logger.info('Bootstrapping Vortex runtime', { nodeEnv: config.nodeEnv });

  assertDiscordConfig(config);
  if (config.database.mode === 'mongo') {
    assertDatabaseConfig(config);
  }

  const guildSettings = await createGuildSettingsService(config);
  const entitlements = createEntitlementService(config, logger);
  const commands = await loadCommandsFromDirectory(commandsDirectory());
  const events = await loadEventsFromDirectory(eventsDirectory());

  const client = new Client({
    intents: resolveGatewayIntents(config.intents),
  });

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  setBotContext({
    client,
    config,
    logger,
    guildSettings,
    entitlements,
    commands,
    rest,
    startedAt,
  });

  registerEvents(client, events);

  registerGracefulShutdown(
    [
      async () => {
        logger.info('Received shutdown signal; cleaning up resources');
        client.removeAllListeners();
        await client.destroy();
        await guildSettings.disconnect();
        clearBotContext();
      },
    ],
    logger,
  );

  await client.login(config.discord.token);
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
