import postgres from 'postgres';

export type Sql = ReturnType<typeof postgres>;
/** Connection or transaction handle for control-plane writes. */
export type PgClient = Sql | postgres.TransactionSql<{}>;

let singleton: Sql | null = null;

/**
 * Postgres connection for the control plane. Set `CONTROL_PLANE_DATABASE_URL` (e.g. Neon, RDS,
 * local Postgres). When unset, dashboard features fall back to in-memory telemetry only.
 */
export function getControlPlaneSql(): Sql | null {
  const url = process.env['CONTROL_PLANE_DATABASE_URL']?.trim();
  if (!url) {
    return null;
  }
  if (!singleton) {
    singleton = postgres(url, {
      max: Number(process.env['CONTROL_PLANE_PG_POOL'] ?? 8),
      prepare: false,
    });
  }
  return singleton;
}
