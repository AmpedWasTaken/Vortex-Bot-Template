import { getBotContext } from '../context/botContext.js';
import type { GuildSettingsDoc } from '../types/index.js';
import type { NormalizedEntitlement } from './entitlements.js';

const MAX_INGEST_GUILDS = 200;

let debounceTimer: NodeJS.Timeout | undefined;

export interface IngestGuildPayload {
  id: string;
  name: string;
  icon: string | null;
}

async function buildPayload(): Promise<{
  guildCount: number;
  premiumSkuIds: string[];
  entitlements: NormalizedEntitlement[];
  nodeEnv: string;
  guilds: IngestGuildPayload[];
  guildSettings: GuildSettingsDoc[];
}> {
  const { client, config, entitlements, guildSettings } = getBotContext();
  const guildIds = [...client.guilds.cache.keys()].sort().slice(0, MAX_INGEST_GUILDS);
  const guilds: IngestGuildPayload[] = guildIds.map((id) => {
    const g = client.guilds.cache.get(id);
    return {
      id,
      name: g?.name ?? 'Unknown',
      icon: g?.icon ?? null,
    };
  });
  const guildSettingsRows = await Promise.all(
    guildIds.map(async (id) => guildSettings.getOrCreate(id)),
  );
  return {
    guildCount: client.guilds.cache.size,
    premiumSkuIds: [...config.monetization.premiumSkuIds],
    entitlements: entitlements.snapshot().slice(0, 500),
    nodeEnv: config.nodeEnv,
    guilds,
    guildSettings: guildSettingsRows,
  };
}

async function postIngest(reason: string): Promise<void> {
  const { config, logger } = getBotContext();
  const ingest = config.dashboardIngest;
  if (!ingest) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 12_000);

  try {
    const payload = await buildPayload();
    const res = await fetch(ingest.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ingest.secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, reason }),
      signal: controller.signal,
    });
    if (!res.ok) {
      logger.warn('Dashboard ingest rejected', { status: res.status, reason });
    } else {
      logger.debug('Dashboard ingest delivered', { reason });
    }
  } catch (error) {
    logger.warn('Dashboard ingest failed', {
      reason,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Fire-and-forget snapshot after entitlement mutations (debounced). */
export function scheduleDashboardIngestPush(): void {
  const { config } = getBotContext();
  if (!config.dashboardIngest) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined;
    void postIngest('entitlements');
  }, 2000);
}

/** Immediate snapshot (e.g. after `ClientReady`). */
export async function flushDashboardIngestNow(reason: string): Promise<void> {
  const { config } = getBotContext();
  if (!config.dashboardIngest) return;
  await postIngest(reason);
}
