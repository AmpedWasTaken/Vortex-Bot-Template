import type { AutoModerationRule, Guild, Snowflake } from 'discord.js';

/** Returns all AutoMod rules for a guild (cached + REST as implemented by discord.js). */
export async function fetchAutoModerationRules(
  guild: Guild,
): Promise<ReadonlyMap<Snowflake, AutoModerationRule>> {
  return guild.autoModerationRules.fetch();
}

export async function fetchAutoModerationRule(
  guild: Guild,
  ruleId: Snowflake,
): Promise<AutoModerationRule | null> {
  try {
    return await guild.autoModerationRules.fetch(ruleId);
  } catch {
    return null;
  }
}

export async function deleteAutoModerationRule(
  guild: Guild,
  ruleId: Snowflake,
  reason?: string,
): Promise<void> {
  await guild.autoModerationRules.delete(ruleId, reason);
}
