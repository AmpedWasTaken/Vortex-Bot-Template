import type { JSONValue } from 'postgres';
import type { PgClient } from '@/lib/db';
import { getControlPlaneSql } from '@/lib/db';

export async function insertAudit(
  entry: { actor: string; action: string; meta?: Record<string, unknown> },
  client?: PgClient | null,
): Promise<void> {
  const sql = client ?? getControlPlaneSql();
  if (!sql) return;
  const metaJson = (entry.meta ?? {}) as JSONValue;
  await sql`
    INSERT INTO audit_log (actor, action, meta)
    VALUES (${entry.actor}, ${entry.action}, ${sql.json(metaJson)})
  `;
}
