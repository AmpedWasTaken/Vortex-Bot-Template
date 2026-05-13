import mongoose from 'mongoose';
import type { AppConfig } from '../config/index.js';
import { assertDatabaseConfig } from '../config/index.js';
import { GuildSettingsModel } from '../models/GuildSettings.js';
import type { GuildSettingsDoc, IGuildSettingsService } from '../types/index.js';
import { SqliteGuildStore } from './sqliteGuildStore.js';

const emptyDoc = (guildId: string): GuildSettingsDoc => ({
  guildId,
  modRoleIds: [],
  adminRoleIds: [],
});

export class GuildSettingsService implements IGuildSettingsService {
  private sqlite: SqliteGuildStore | null = null;
  private readonly cache = new Map<string, GuildSettingsDoc>();

  constructor(private readonly config: AppConfig) {}

  async connect(): Promise<void> {
    if (this.config.database.mode === 'mongo') {
      assertDatabaseConfig(this.config);
      const uri = this.config.database.mongoUri;
      if (!uri) {
        throw new Error('Mongo URI missing despite DATABASE_MODE=mongo.');
      }
      await mongoose.connect(uri);
      return;
    }

    if (this.config.database.mode === 'sqlite') {
      this.sqlite = new SqliteGuildStore(this.config.database.sqlitePath);
    }
  }

  async disconnect(): Promise<void> {
    if (this.config.database.mode === 'mongo') {
      await mongoose.disconnect();
    }
    this.sqlite?.close();
    this.sqlite = null;
    this.cache.clear();
  }

  async getOrCreate(guildId: string): Promise<GuildSettingsDoc> {
    if (this.config.database.mode === 'mock') {
      const cached = this.cache.get(guildId);
      if (cached) return cached;
      const created = emptyDoc(guildId);
      this.cache.set(guildId, created);
      return created;
    }

    if (this.config.database.mode === 'sqlite') {
      if (!this.sqlite) throw new Error('SQLite store not initialized. Call connect() first.');
      const existing = this.sqlite.get(guildId);
      if (existing) return existing;
      const created = emptyDoc(guildId);
      this.sqlite.upsert(created);
      return created;
    }

    let doc = await GuildSettingsModel.findOne({ guildId }).lean().exec();
    if (!doc) {
      await GuildSettingsModel.create(emptyDoc(guildId));
      doc = await GuildSettingsModel.findOne({ guildId }).lean().exec();
    }
    if (!doc) {
      throw new Error('Failed to persist default guild settings.');
    }

    const result: GuildSettingsDoc = {
      guildId: doc.guildId,
      modRoleIds: [...doc.modRoleIds],
      adminRoleIds: [...doc.adminRoleIds],
    };
    if (doc.logChannelId) {
      result.logChannelId = doc.logChannelId;
    }
    return result;
  }
}

export async function createGuildSettingsService(config: AppConfig): Promise<GuildSettingsService> {
  const service = new GuildSettingsService(config);
  await service.connect();
  return service;
}
