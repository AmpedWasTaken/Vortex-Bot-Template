import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/index.js';

/**
 * Minimal example of **handler-level** premium gating via `requiresPaidSkus`
 * (runs after permission checks, before `execute`).
 */
export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('vip')
    .setDescription('Premium-only command (uses BotCommand.requiresPaidSkus + interaction entitlements)'),
  requiredPermission: 'user',
  requiresPaidSkus: true,
  async execute(interaction, ctx) {
    const skus = [...ctx.entitlements.interactionActiveSkuIds(interaction)];
    await interaction.reply({
      ephemeral: true,
      content: `VIP unlocked. Active SKUs on this interaction: ${skus.length > 0 ? skus.map((id) => `\`${id}\``).join(', ') : '_(unexpected — gate should have blocked)_'}`,
    });
  },
};
