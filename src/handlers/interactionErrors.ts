import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { ILogger } from '../types/index.js';

export async function withInteractionErrorBoundary(
  logger: ILogger,
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    logger.error('Interaction handler failed', {
      command: interaction.commandName,
      error: error instanceof Error ? error.message : String(error),
    });

    if (interaction.isAutocomplete()) {
      try {
        await interaction.respond([]);
      } catch {
        // ignore
      }
      return;
    }

    const message = 'Something went wrong while executing this command.';
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, ephemeral: true }).catch(() => undefined);
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => undefined);
    }
  }
}
