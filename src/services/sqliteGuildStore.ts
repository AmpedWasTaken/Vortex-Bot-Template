import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GuildSettingsDoc } from '../types/index.js';

interface Row {
  guild_id: string;
  mod_role_ids: string;
  admin_role_ids: string;
  log_channel_id: string | null;
}

function parseRow(row: Row): GuildSettingsDoc {
  const doc: GuildSettingsDoc = {
    guildId: row.guild_id,
    modRoleIds: JSON.parse(row.mod_role_ids) as string[],
    adminRoleIds: JSON.parse(row.admin_role_ids) as string[],
  };
  if (row.log_channel_id) {
    doc.logChannelId = row.log_channel_id;
  }
  return doc;
}

export class SqliteGuildStore {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY NOT NULL,
        mod_role_ids TEXT NOT NULL DEFAULT '[]',
        admin_role_ids TEXT NOT NULL DEFAULT '[]',
        log_channel_id TEXT
      );
    `);
  }

  get(guildId: string): GuildSettingsDoc | null {
    const row = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId) as
      | Row
      | undefined;
    return row ? parseRow(row) : null;
  }

  upsert(doc: GuildSettingsDoc): void {
    this.db
      .prepare(
        `INSERT INTO guild_settings (guild_id, mod_role_ids, admin_role_ids, log_channel_id)
         VALUES (@guildId, @modRoleIds, @adminRoleIds, @logChannelId)
         ON CONFLICT(guild_id) DO UPDATE SET
           mod_role_ids = excluded.mod_role_ids,
           admin_role_ids = excluded.admin_role_ids,
           log_channel_id = excluded.log_channel_id`,
      )
      .run({
        guildId: doc.guildId,
        modRoleIds: JSON.stringify(doc.modRoleIds),
        adminRoleIds: JSON.stringify(doc.adminRoleIds),
        logChannelId: doc.logChannelId ?? null,
      });
  }

  close(): void {
    this.db.close();
  }
}
