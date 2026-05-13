import { Events, type Entitlement } from 'discord.js';
import { getBotContext } from '../context/botContext.js';
import { scheduleDashboardIngestPush } from '../services/dashboardIngest.js';
import type { BotEvent } from '../types/index.js';

export const event: BotEvent<typeof Events.EntitlementDelete> = {
  name: Events.EntitlementDelete,
  execute(entitlement: Entitlement) {
    getBotContext().entitlements.remove(entitlement);
    scheduleDashboardIngestPush();
  },
};
