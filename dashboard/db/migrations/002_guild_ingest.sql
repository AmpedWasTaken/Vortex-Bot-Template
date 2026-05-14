-- Guild directory + settings mirror (from bot ingest)

ALTER TABLE bot_ingest_snapshots
  ADD COLUMN IF NOT EXISTS guilds jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE bot_ingest_snapshots
  ADD COLUMN IF NOT EXISTS guild_settings jsonb NOT NULL DEFAULT '[]'::jsonb;
