import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type GuildMember,
  type REST,
  Routes,
} from 'discord.js';
import type { AppConfig } from '../config/index.js';
import type { BotCommand, CommandContext } from '../types/index.js';
import { hasPermission } from '../utils/permissions.js';
import { withInteractionErrorBoundary } from './interactionErrors.js';

export async function registerSlashCommands(
  rest: REST,
  config: AppConfig,
  commands: Map<string, BotCommand>,
): Promise<void> {
  const body = [...commands.values()].map((c) => c.data.toJSON());
  if (config.discord.guildId) {
    await rest.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId), {
      body,
    });
  } else {
    await rest.put(Routes.applicationCommands(config.discord.clientId), { body });
  }
}

export async function handleAutocomplete(
  interaction: AutocompleteInteraction,
  commands: Map<string, BotCommand>,
  ctx: CommandContext,
): Promise<void> {
  const command = commands.get(interaction.commandName);
  if (!command?.autocomplete) return;
  await withInteractionErrorBoundary(ctx.logger, interaction, async () => {
    await command.autocomplete?.(interaction, ctx);
  });
}

export async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction,
  commands: Map<string, BotCommand>,
  ctx: CommandContext,
): Promise<void> {
  const command = commands.get(interaction.commandName);
  if (!command) {
    ctx.logger.warn('Unknown command invoked', { command: interaction.commandName });
    return;
  }

  await withInteractionErrorBoundary(ctx.logger, interaction, async () => {
    let member: GuildMember | null = null;
    if (interaction.inGuild() && interaction.guild) {
      try {
        member = await interaction.guild.members.fetch(interaction.user.id);
      } catch {
        member = null;
      }
    }

    const guildId = interaction.guildId;
    const guildDoc = guildId ? await ctx.guildSettings.getOrCreate(guildId) : null;

    const required = command.requiredPermission ?? 'user';
    if (!hasPermission(member, required, ctx.config, guildDoc)) {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    await command.execute(interaction, ctx);
  });
}
