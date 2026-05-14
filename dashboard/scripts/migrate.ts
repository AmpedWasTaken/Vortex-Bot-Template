import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const dashboardRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(dashboardRoot, 'db', 'migrations');

/** Load `dashboard/.env.local` when `CONTROL_PLANE_DATABASE_URL` is not already set (Docker supplies env directly). */
function loadLocalEnvIfNeeded(): void {
  if (process.env['CONTROL_PLANE_DATABASE_URL']?.trim()) return;
  const envPath = path.join(dashboardRoot, '.env.local');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

async function main(): Promise<void> {
  loadLocalEnvIfNeeded();
  const url = process.env['CONTROL_PLANE_DATABASE_URL']?.trim();
  if (!url) {
    throw new Error('CONTROL_PLANE_DATABASE_URL is not set.');
  }

  const sql = postgres(url, { max: 1, prepare: false });
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const existsRows = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'schema_migrations'
      ) AS exists
    `;
    const migrationsTableExists = existsRows[0]?.exists ?? false;

    if (migrationsTableExists) {
      const applied = await sql<{ x: number }[]>`
        SELECT 1 AS x FROM schema_migrations WHERE id = ${file} LIMIT 1
      `;
      if (applied.length > 0) {
        console.log(`skip ${file} (already applied)`);
        continue;
      }
    }

    const body = readFileSync(path.join(migrationsDir, file), 'utf8');
    await sql.unsafe(body);
    await sql`
      INSERT INTO schema_migrations (id) VALUES (${file})
      ON CONFLICT (id) DO NOTHING
    `;
    console.log(`applied ${file}`);
  }

  await sql.end({ timeout: 5 });
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
