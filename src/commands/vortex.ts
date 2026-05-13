import { ComponentType, MessageFlags, SeparatorSpacingSize, SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/index.js';

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('vortex')
    .setDescription('Framework metadata and utilities')
    .addSubcommand((sub) =>
      sub.setName('about').setDescription('Show template version and runtime info'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('components2')
        .setDescription('Demo ephemeral reply using top-level Components v2'),
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
      return;
    }

    if (sub === 'components2') {
      await interaction.reply({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [
          {
            type: ComponentType.Container,
            components: [
              { type: ComponentType.TextDisplay, content: '## Vortex · Components v2' },
              {
                type: ComponentType.Separator,
                spacing: SeparatorSpacingSize.Small,
                divider: true,
              },
              {
                type: ComponentType.TextDisplay,
                content:
                  'This reply uses top-level v2 layout (Container → TextDisplay → Separator) with `MessageFlags.IsComponentsV2`. It is separate from classic v1 `ActionRow` + button/select patterns.',
              },
            ],
          },
        ],
      });
    }
  },
};
