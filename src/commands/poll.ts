import { ChannelType, PollLayoutType, SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/index.js';

const MAX_ANSWER_LEN = 55;

function parseAnswersPipe(raw: string): string[] {
  return raw
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create or end Discord message polls')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Post a poll in a text channel')
        .addStringOption((o) =>
          o
            .setName('question')
            .setDescription('Poll question (max 300 characters)')
            .setRequired(true)
            .setMaxLength(300),
        )
        .addStringOption((o) =>
          o
            .setName('answers')
            .setDescription('Pipe-separated choices, e.g. Blue|Red|Green (2–10, max 55 chars each)')
            .setRequired(true)
            .setMaxLength(600),
        )
        .addIntegerOption((o) =>
          o
            .setName('duration_hours')
            .setDescription('Hours the poll stays open (default 24, max 768 ≈ 32 days)')
            .setMinValue(1)
            .setMaxValue(768),
        )
        .addBooleanOption((o) =>
          o.setName('allow_multiselect').setDescription('Let members pick more than one answer'),
        )
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('Where to post (defaults to this channel)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('end')
        .setDescription('End a poll on a message (must be a poll this app created)')
        .addStringOption((o) =>
          o.setName('message_id').setDescription('Snowflake of the poll message').setRequired(true),
        )
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('Channel containing the poll (defaults to this channel)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        ),
    ),
  requiredPermission: 'moderator',
  async execute(interaction, ctx) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: 'Poll commands are only available inside a server.',
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand(true);

    if (sub === 'create') {
      const question = interaction.options.getString('question', true);
      const answersRaw = interaction.options.getString('answers', true);
      const options = parseAnswersPipe(answersRaw);

      if (options.length < 2 || options.length > 10) {
        await interaction.reply({
          content: 'Provide between **2** and **10** answers, separated by `|`.',
          ephemeral: true,
        });
        return;
      }

      const tooLong = options.find((t) => t.length > MAX_ANSWER_LEN);
      if (tooLong) {
        await interaction.reply({
          content: `Each answer must be at most **${String(MAX_ANSWER_LEN)}** characters.`,
          ephemeral: true,
        });
        return;
      }

      const durationHours = interaction.options.getInteger('duration_hours') ?? 24;
      const allowMultiselect = interaction.options.getBoolean('allow_multiselect') ?? false;

      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({
          content: 'Guild data is not available — try again in a moment.',
          ephemeral: true,
        });
        return;
      }

      const channelId = interaction.options.getChannel('channel')?.id ?? interaction.channelId;
      if (!channelId) {
        await interaction.reply({
          content: 'Could not resolve a target channel.',
          ephemeral: true,
        });
        return;
      }

      const channel = await guild.channels.fetch(channelId);
      if (!channel?.isTextBased()) {
        await interaction.reply({
          content: 'Choose a text or announcement channel, or run this command in one.',
          ephemeral: true,
        });
        return;
      }

      try {
        const msg = await channel.send({
          poll: {
            question: { text: question },
            answers: options.map((text) => ({ text })),
            duration: durationHours,
            allowMultiselect,
            layoutType: PollLayoutType.Default,
          },
        });
        ctx.logger.info('Poll created', {
          guildId: interaction.guildId,
          channelId: channel.id,
          messageId: msg.id,
        });
        await interaction.reply({
          content: `Poll posted: ${msg.url}`,
          ephemeral: true,
        });
      } catch {
        await interaction.reply({
          content:
            'Could not post the poll. Confirm the bot can **Send Messages** in that channel and the guild allows polls.',
          ephemeral: true,
        });
      }
      return;
    }

    if (sub === 'end') {
      const messageId = interaction.options.getString('message_id', true);

      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({
          content: 'Guild data is not available — try again in a moment.',
          ephemeral: true,
        });
        return;
      }

      const channelId = interaction.options.getChannel('channel')?.id ?? interaction.channelId;
      if (!channelId) {
        await interaction.reply({
          content: 'Could not resolve a target channel.',
          ephemeral: true,
        });
        return;
      }

      const channel = await guild.channels.fetch(channelId);
      if (!channel?.isTextBased()) {
        await interaction.reply({
          content: 'Choose a text or announcement channel, or run this command there.',
          ephemeral: true,
        });
        return;
      }

      try {
        const msg = await channel.messages.fetch(messageId);
        if (!msg.poll) {
          await interaction.reply({
            content: 'That message is not an active poll.',
            ephemeral: true,
          });
          return;
        }
        await msg.poll.end();
        ctx.logger.info('Poll ended', {
          guildId: interaction.guildId,
          channelId: channel.id,
          messageId: msg.id,
        });
        await interaction.reply({ content: 'Poll ended.', ephemeral: true });
      } catch {
        await interaction.reply({
          content: 'Could not fetch or end that poll (wrong channel, ID, or missing permissions).',
          ephemeral: true,
        });
      }
    }
  },
};
