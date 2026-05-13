import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/index.js';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Discord monetization diagnostics and a subcommand-gated demo')
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('List active entitlements on this interaction (no purchase required)'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('demo')
        .setDescription(
          'Subcommand-level premium check (mirrors interaction.entitlements + PREMIUM_SKU_IDS logic)',
        ),
    ),
  requiredPermission: 'user',
  async execute(interaction, ctx) {
    const sub = interaction.options.getSubcommand(true);

    if (sub === 'status') {
      const active = [...ctx.entitlements.interactionActiveSkuIds(interaction)];
      const configured = ctx.config.monetization.premiumSkuIds;
      const lines = [
        '**Interaction entitlements** (active SKU IDs)',
        active.length > 0 ? active.map((id) => `\`${id}\``).join(', ') : '_None — no active SKUs on this invocation._',
        '',
        '**Configured premium SKUs** (`PREMIUM_SKU_IDS`)',
        configured.length > 0 ? configured.map((id) => `\`${id}\``).join(', ') : '_Not set._',
        '',
        `**Gateway cache size:** ${String(ctx.entitlements.size())} entitlement record(s) from create/update/delete events.`,
      ];
      await interaction.reply({ content: lines.join('\n'), ephemeral: true });
      return;
    }

    if (sub === 'demo') {
      const skuIds = ctx.config.monetization.premiumSkuIds;
      if (skuIds.length === 0) {
        await interaction.reply({
          content:
            'Set `PREMIUM_SKU_IDS` to your premium SKU snowflake(s), then retry. For whole commands, use `requiresPaidSkus: true` on `BotCommand` (see `/vip`).',
          ephemeral: true,
        });
        return;
      }
      if (!ctx.entitlements.interactionHasPremiumSku(interaction)) {
        await interaction.reply({
          content:
            'No matching active entitlement on this interaction. Purchase or grant the SKU in the Developer Portal (or enable `DEV_ENTITLEMENT_BYPASS=true` outside production).',
          ephemeral: true,
        });
        return;
      }
      await interaction.reply({
        content: 'Demo subcommand: premium SKU matched on `interaction.entitlements`.',
        ephemeral: true,
      });
    }
  },
};
