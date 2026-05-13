import 'dotenv/config';
import { GatewayIntentBits } from 'discord.js';

export interface IntentConfig {
  /** Guild member lifecycle + permission hydration (e.g. `guildMemberAdd`, member fetch for slash perms). */
  guildMembers: boolean;
  /** `autoModerationActionExecution` and related automod rule gateway events. */
  autoModerationExecution: boolean;
  /** `messagePollVoteAdd` / `messagePollVoteRemove` for poll analytics. */
  guildMessagePolls: boolean;
  /**
   * Privileged — raw message content in messages (not required for polls, slash, or most templates).
   * @see https://discord.com/developers/docs/topics/gateway#message-content-intent
   */
  messageContent: boolean;
}

function envBool(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined) return defaultValue;
  const v = raw.toLowerCase();
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  return defaultValue;
}

export function loadIntentConfig(): IntentConfig {
  return {
    guildMembers: envBool('INTENT_GUILD_MEMBERS', true),
    autoModerationExecution: envBool('INTENT_AUTOMOD_EXECUTION', true),
    guildMessagePolls: envBool('INTENT_GUILD_MESSAGE_POLLS', true),
    messageContent: envBool('INTENT_MESSAGE_CONTENT', false),
  };
}

/** Bitfield-ready list for `new Client({ intents })`. Always includes `Guilds`. */
export function resolveGatewayIntents(intents: IntentConfig): number[] {
  const bits: number[] = [GatewayIntentBits.Guilds];
  if (intents.guildMembers) bits.push(GatewayIntentBits.GuildMembers);
  if (intents.autoModerationExecution) bits.push(GatewayIntentBits.AutoModerationExecution);
  if (intents.guildMessagePolls) bits.push(GatewayIntentBits.GuildMessagePolls);
  if (intents.messageContent) bits.push(GatewayIntentBits.MessageContent);
  return bits;
}
