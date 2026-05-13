import type { JSONValue } from 'postgres';
import type { PgClient } from '@/lib/db';
import { getControlPlaneSql } from '@/lib/db';
import { insertAudit } from '@/lib/audit';

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

let memSnapshot: BotTelemetrySnapshot | null = null;
const memActivity: { at: string; label: string }[] = [];

function recordMemory(next: Omit<BotTelemetrySnapshot, 'receivedAt'>): void {
  const receivedAt = new Date().toISOString();
  memSnapshot = { ...next, receivedAt };
  memActivity.unshift({
    at: receivedAt,
    label: next.reason ? `Bot ingest · ${next.reason}` : 'Bot ingest',
  });
  if (memActivity.length > MAX_ACTIVITY) {
    memActivity.length = MAX_ACTIVITY;
  }
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

function parseEntitlementsJson(value: unknown): IngestEntitlement[] {
  if (!Array.isArray(value)) return [];
  const parsed = parseIngestBody({
    guildCount: 0,
    premiumSkuIds: [],
    entitlements: value,
  });
  return parsed?.entitlements ?? [];
}

async function readLatestFromDb(sql: PgClient): Promise<BotTelemetrySnapshot | null> {
  const rows = await sql<
    {
      received_at: string;
      reason: string | null;
      guild_count: number;
      premium_sku_ids: string[] | null;
      node_env: string | null;
      entitlements: unknown;
    }[]
  >`
    SELECT received_at, reason, guild_count, premium_sku_ids, node_env, entitlements
    FROM bot_ingest_snapshots
    ORDER BY id DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    receivedAt: new Date(row.received_at).toISOString(),
    guildCount: row.guild_count,
    premiumSkuIds: row.premium_sku_ids ?? [],
    entitlements: parseEntitlementsJson(row.entitlements),
    nodeEnv: row.node_env ?? undefined,
    reason: row.reason ?? undefined,
  };
}

async function readActivityFromDb(sql: PgClient): Promise<{ at: string; label: string }[]> {
  const rows = await sql<
    { created_at: string; action: string; meta: Record<string, unknown> | null }[]
  >`
    SELECT created_at, action, meta
    FROM audit_log
    WHERE action IN ('bot.ingest', 'stripe.webhook.processed')
    ORDER BY id DESC
    LIMIT ${MAX_ACTIVITY}
  `;
  return rows.map((r) => ({
    at: new Date(r.created_at).toISOString(),
    label:
      r.action === 'bot.ingest'
        ? `Bot ingest · ${typeof r.meta?.['reason'] === 'string' ? (r.meta['reason'] as string) : 'ingest'}`
        : `Stripe webhook · ${typeof r.meta?.['type'] === 'string' ? (r.meta['type'] as string) : 'event'}`,
  }));
}

export async function recordBotIngest(
  next: Omit<BotTelemetrySnapshot, 'receivedAt'>,
): Promise<void> {
  const sql = getControlPlaneSql();
  const receivedAt = new Date();
  if (!sql) {
    recordMemory(next);
    return;
  }

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO bot_ingest_snapshots (received_at, reason, guild_count, premium_sku_ids, node_env, entitlements)
      VALUES (
        ${receivedAt},
        ${next.reason ?? null},
        ${next.guildCount},
        ${tx.array(next.premiumSkuIds)},
        ${next.nodeEnv ?? null},
        ${tx.json(next.entitlements as unknown as JSONValue)}
      )
    `;
    await insertAudit(
      {
        actor: 'bot',
        action: 'bot.ingest',
        meta: { reason: next.reason ?? null, guildCount: next.guildCount },
      },
      tx,
    );
  });
}

export async function getBotTelemetry(): Promise<{
  snapshot: BotTelemetrySnapshot | null;
  activity: readonly { at: string; label: string }[];
  persistence: 'postgres' | 'memory';
}> {
  const sql = getControlPlaneSql();
  if (!sql) {
    return { snapshot: memSnapshot, activity: [...memActivity], persistence: 'memory' };
  }
  const snapshot = await readLatestFromDb(sql);
  const activity = await readActivityFromDb(sql);
  return { snapshot, activity, persistence: 'postgres' };
}
