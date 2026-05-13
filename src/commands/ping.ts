import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/index.js';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Vortex connectivity checks')
    .addSubcommand((sub) =>
      sub.setName('latency').setDescription('Show Discord gateway latency'),
    )
    .addSubcommand((sub) =>
      sub.setName('echo').setDescription('Echo a phrase').addStringOption((opt) =>
        opt.setName('message').setDescription('Text to echo').setRequired(true),
      ),
    ),
  requiredPermission: 'user',
  async execute(interaction, ctx) {
    const sub = interaction.options.getSubcommand(true);
    if (sub === 'latency') {
      const ping = interaction.client.ws.ping;
      await interaction.reply({
        content: `Pong! WebSocket latency is **${String(ping)}ms**.`,
        ephemeral: true,
      });
      ctx.logger.debug('Ping latency command executed', { ping });
      return;
    }

    if (sub === 'echo') {
      const message = interaction.options.getString('message', true);
      await interaction.reply({ content: message, ephemeral: true });
    }
  },
};
