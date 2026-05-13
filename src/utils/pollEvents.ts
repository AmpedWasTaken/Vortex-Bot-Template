import type { PartialPollAnswer, PollAnswer, Snowflake } from 'discord.js';
import { getBotContext } from '../context/botContext.js';

export function logPollVote(
  label: 'Poll vote added' | 'Poll vote removed',
  pollAnswer: PollAnswer | PartialPollAnswer,
  userId: Snowflake,
): void {
  const { logger } = getBotContext();
  const message = pollAnswer.poll.message;
  if (!message.guildId || !message.channelId || !message.id) return;

  const meta: Record<string, unknown> = {
    guildId: message.guildId,
    channelId: message.channelId,
    messageId: message.id,
    userId,
  };
  if (typeof pollAnswer.id === 'number') {
    meta['answerId'] = pollAnswer.id;
  }
  logger.debug(label, meta);
}
