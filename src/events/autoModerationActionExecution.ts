import { Events, type AutoModerationActionExecution } from 'discord.js';
import { getBotContext } from '../context/botContext.js';
import type { BotEvent } from '../types/index.js';

export const event: BotEvent<typeof Events.AutoModerationActionExecution> = {
  name: Events.AutoModerationActionExecution,
  execute(execution: AutoModerationActionExecution) {
    const { logger } = getBotContext();
    logger.info('AutoMod action executed', {
      guildId: execution.guild.id,
      ruleId: execution.ruleId,
      ruleTriggerType: execution.ruleTriggerType,
      actionType: execution.action.type,
      userId: execution.userId,
      channelId: execution.channelId,
      messageId: execution.messageId,
      hasMatchedKeyword: execution.matchedKeyword !== null,
      hasMatchedContent: execution.matchedContent !== null,
    });
  },
};
