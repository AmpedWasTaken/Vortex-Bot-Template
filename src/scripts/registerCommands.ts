import { REST } from 'discord.js';
import { assertDiscordConfig, loadConfig } from '../config/index.js';
import { registerSlashCommands } from '../handlers/commandHandler.js';
import { commandsDirectory, loadCommandsFromDirectory } from '../handlers/commandRegistry.js';

async function main(): Promise<void> {
  const config = loadConfig();
  assertDiscordConfig(config);
  const commands = await loadCommandsFromDirectory(commandsDirectory());
  const rest = new REST({ version: '10' }).setToken(config.discord.token);
  await registerSlashCommands(rest, config, commands);
  console.log(`Registered ${String(commands.size)} slash command(s).`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
