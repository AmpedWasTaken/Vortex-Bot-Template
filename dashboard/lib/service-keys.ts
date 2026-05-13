import { createHash, randomBytes } from 'node:crypto';
import type { Sql } from '@/lib/db';
import { getControlPlaneSql } from '@/lib/db';

const KEY_PREFIX = 'vrtx_';

export function hashServiceKey(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

export function generateOperatorKey(): { raw: string; prefix: string; hash: string } {
  const suffix = randomBytes(24).toString('hex');
  const raw = `${KEY_PREFIX}${suffix}`;
  const prefix = `${raw.slice(0, 12)}…`;
  return { raw, prefix, hash: hashServiceKey(raw) };
}

export async function insertServiceApiKey(
  name: string,
  scopes: string[],
): Promise<{ raw: string; prefix: string }> {
  const sql = getControlPlaneSql();
  if (!sql) {
    throw new Error('CONTROL_PLANE_DATABASE_URL is not set.');
  }
  const { raw, prefix, hash } = generateOperatorKey();
  await sql`
    INSERT INTO service_api_keys (name, key_prefix, key_hash, scopes)
    VALUES (${name}, ${prefix}, ${hash}, ${sql.array(scopes)})
  `;
  return { raw, prefix };
}

export async function verifyServiceApiKey(
  rawKey: string | undefined,
): Promise<{ id: string; name: string; scopes: string[] } | null> {
  if (!rawKey?.trim()) return null;
  const sql = getControlPlaneSql();
  if (!sql) return null;
  const hash = hashServiceKey(rawKey.trim());
  const rows = await sql<{ id: string; name: string; scopes: string[] }[]>`
    SELECT id::text AS id, name, scopes
    FROM service_api_keys
    WHERE key_hash = ${hash} AND revoked_at IS NULL
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  void sql`
    UPDATE service_api_keys SET last_used_at = now() WHERE key_hash = ${hash}
  `.catch(() => {
    /* ignore */
  });
  return { id: row.id, name: row.name, scopes: row.scopes ?? [] };
}

export function parseBearerToken(header: string | null): string | undefined {
  if (!header) return undefined;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1];
}
