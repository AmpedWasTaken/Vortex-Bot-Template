import { Schema, model, type InferSchemaType } from 'mongoose';

const guildSettingsSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    modRoleIds: { type: [String], default: [] },
    adminRoleIds: { type: [String], default: [] },
    logChannelId: { type: String },
  },
  { timestamps: true, collection: 'guild_settings' },
);

export type GuildSettingsMongo = InferSchemaType<typeof guildSettingsSchema>;
export const GuildSettingsModel = model('GuildSettings', guildSettingsSchema);
