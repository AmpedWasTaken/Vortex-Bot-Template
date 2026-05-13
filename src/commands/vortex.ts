import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/index.js';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('vortex')
    .setDescription('Framework metadata and utilities')
    .addSubcommand((sub) =>
      sub.setName('about').setDescription('Show template version and runtime info'),
    ),
  requiredPermission: 'user',
  async execute(interaction, ctx) {
    const sub = interaction.options.getSubcommand(true);
    if (sub === 'about') {
      await interaction.reply({
        ephemeral: true,
        content: [
          '**Vortex Bot Template**',
          `Node ${process.version} · ${ctx.config.database.mode} database`,
          `Environment: **${ctx.config.nodeEnv}**`,
        ].join('\n'),
      });
    }
  },
};
