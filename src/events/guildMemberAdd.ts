import { Events, type GuildMember } from 'discord.js';
import { getBotContext } from '../context/botContext.js';
import type { BotEvent } from '../types/index.js';

export const event: BotEvent<typeof Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  execute(member: GuildMember) {
    const { logger } = getBotContext();
    logger.info('Member joined guild', {
      guildId: member.guild.id,
      userId: member.id,
      username: member.user.tag,
    });
  },
};
