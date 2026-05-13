export type IngestEntitlement = {
  id: string;
  skuId: string;
  userId: string;
  guildId: string | null;
  type: number;
  deleted: boolean;
  consumed: boolean;
  isActive: boolean;
};

export type BotTelemetrySnapshot = {
  receivedAt: string;
  guildCount: number;
  premiumSkuIds: string[];
  entitlements: IngestEntitlement[];
  nodeEnv?: string;
  reason?: string;
};

const MAX_ACTIVITY = 40;

let snapshot: BotTelemetrySnapshot | null = null;
const activity: { at: string; label: string }[] = [];

export function recordBotIngest(next: Omit<BotTelemetrySnapshot, 'receivedAt'>): void {
  const receivedAt = new Date().toISOString();
  snapshot = { ...next, receivedAt };
  activity.unshift({
    at: receivedAt,
    label: next.reason ? `Bot ingest · ${next.reason}` : 'Bot ingest',
  });
  if (activity.length > MAX_ACTIVITY) {
    activity.length = MAX_ACTIVITY;
  }
}

export function getBotTelemetry(): {
  snapshot: BotTelemetrySnapshot | null;
  activity: readonly { at: string; label: string }[];
} {
  return { snapshot, activity: [...activity] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseIngestBody(body: unknown): Omit<BotTelemetrySnapshot, 'receivedAt'> | null {
  if (!isRecord(body)) return null;
  const guildCount = body['guildCount'];
  const premiumSkuIds = body['premiumSkuIds'];
  const entitlements = body['entitlements'];
  const nodeEnv = body['nodeEnv'];
  const reason = body['reason'];

  if (typeof guildCount !== 'number' || !Number.isFinite(guildCount)) return null;
  if (!Array.isArray(premiumSkuIds) || !premiumSkuIds.every((s) => typeof s === 'string'))
    return null;
  if (!Array.isArray(entitlements)) return null;

  const normalized: IngestEntitlement[] = [];
  for (const row of entitlements.slice(0, 500)) {
    if (!isRecord(row)) continue;
    const id = row['id'];
    const skuId = row['skuId'];
    const userId = row['userId'];
    const guildId = row['guildId'];
    const type = row['type'];
    const deleted = row['deleted'];
    const consumed = row['consumed'];
    const isActive = row['isActive'];
    if (
      typeof id !== 'string' ||
      typeof skuId !== 'string' ||
      typeof userId !== 'string' ||
      (guildId !== null && typeof guildId !== 'string') ||
      typeof type !== 'number' ||
      typeof deleted !== 'boolean' ||
      typeof consumed !== 'boolean' ||
      typeof isActive !== 'boolean'
    ) {
      continue;
    }
    normalized.push({ id, skuId, userId, guildId, type, deleted, consumed, isActive });
  }

  return {
    guildCount,
    premiumSkuIds,
    entitlements: normalized,
    nodeEnv: typeof nodeEnv === 'string' ? nodeEnv : undefined,
    reason: typeof reason === 'string' ? reason : undefined,
  };
}
