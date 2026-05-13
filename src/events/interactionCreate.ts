import { Events, type Interaction } from 'discord.js';
import { getBotContext } from '../context/botContext.js';
import {
  handleAutocomplete,
  handleChatInputCommand,
} from '../handlers/commandHandler.js';
import type { BotEvent, CommandContext } from '../types/index.js';

export const event: BotEvent<typeof Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    const { config, logger, guildSettings, commands } = getBotContext();
    const ctx: CommandContext = {
      client: interaction.client,
      config,
      logger,
      guildSettings,
    };

    if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction, commands, ctx);
      return;
    }

    if (interaction.isChatInputCommand()) {
      await handleChatInputCommand(interaction, commands, ctx);
    }
  },
};
