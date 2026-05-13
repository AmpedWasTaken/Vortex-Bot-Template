import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const dashboardRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(dashboardRoot, 'db', 'migrations');

async function main(): Promise<void> {
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
