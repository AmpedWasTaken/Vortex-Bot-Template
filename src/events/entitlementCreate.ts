import { Events, type Entitlement } from 'discord.js';
import { getBotContext } from '../context/botContext.js';
import { scheduleDashboardIngestPush } from '../services/dashboardIngest.js';
import type { BotEvent } from '../types/index.js';

export const event: BotEvent<typeof Events.EntitlementCreate> = {
  name: Events.EntitlementCreate,
  execute(entitlement: Entitlement) {
    getBotContext().entitlements.upsert(entitlement);
    scheduleDashboardIngestPush();
  },
};
