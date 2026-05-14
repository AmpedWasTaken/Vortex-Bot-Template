import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const dashboardRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(dashboardRoot, 'db', 'migrations');

/** Apply KEY=VAL lines from a dotenv-style file into `process.env` (does not override existing keys). */
function applyEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
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

/** Load `dashboard/.env.local` then `dashboard/.env` when URL not already in the environment. */
function loadDashboardEnvFiles(): void {
  if (process.env['CONTROL_PLANE_DATABASE_URL']?.trim()) return;
  applyEnvFile(path.join(dashboardRoot, '.env.local'));
  applyEnvFile(path.join(dashboardRoot, '.env'));
}

async function main(): Promise<void> {
  loadDashboardEnvFiles();
  const url = process.env['CONTROL_PLANE_DATABASE_URL']?.trim();
  if (!url) {
    throw new Error(
      [
        'CONTROL_PLANE_DATABASE_URL is not set.',
        '',
        'Fix:',
        '  1. Copy dashboard/.env.example → dashboard/.env.local',
        '  2. Set CONTROL_PLANE_DATABASE_URL (e.g. postgresql://USER:PASS@localhost:5432/DBNAME for local Postgres)',
        '  3. Run: npm run db:migrate',
        '',
        'Or export the variable in this shell before running migrate.',
      ].join('\n'),
    );
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
