import { Events, type PartialPollAnswer, type PollAnswer, type Snowflake } from 'discord.js';
import type { BotEvent } from '../types/index.js';
import { logPollVote } from '../utils/pollEvents.js';

export const event: BotEvent<typeof Events.MessagePollVoteAdd> = {
  name: Events.MessagePollVoteAdd,
  execute(pollAnswer: PollAnswer | PartialPollAnswer, userId: Snowflake) {
    logPollVote('Poll vote added', pollAnswer, userId);
  },
};
