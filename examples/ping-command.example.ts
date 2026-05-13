/**
 * Example: standalone ping-style slash command module.
 * Copy into `src/commands/` and adjust metadata to match your product.
 */
import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/index.js';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('example-ping')
    .setDescription('Example command scaffold'),
  requiredPermission: 'user',
  async execute(interaction, _ctx) {
    await interaction.reply({ content: 'Example command executed.', ephemeral: true });
  },
};
