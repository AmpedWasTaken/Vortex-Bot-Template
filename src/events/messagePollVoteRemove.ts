import { Events, type PartialPollAnswer, type PollAnswer, type Snowflake } from 'discord.js';
import type { BotEvent } from '../types/index.js';
import { logPollVote } from '../utils/pollEvents.js';

export const event: BotEvent<typeof Events.MessagePollVoteRemove> = {
  name: Events.MessagePollVoteRemove,
  execute(pollAnswer: PollAnswer | PartialPollAnswer, userId: Snowflake) {
    logPollVote('Poll vote removed', pollAnswer, userId);
  },
};
