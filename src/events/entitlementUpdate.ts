import { Events, type Entitlement } from 'discord.js';
import { getBotContext } from '../context/botContext.js';
import { scheduleDashboardIngestPush } from '../services/dashboardIngest.js';
import type { BotEvent } from '../types/index.js';

export const event: BotEvent<typeof Events.EntitlementUpdate> = {
  name: Events.EntitlementUpdate,
  execute(_oldEntitlement: Entitlement | null, newEntitlement: Entitlement) {
    const { entitlements } = getBotContext();
    if (newEntitlement.deleted) {
      entitlements.remove(newEntitlement);
    } else {
      entitlements.upsert(newEntitlement);
    }
    scheduleDashboardIngestPush();
  },
};
