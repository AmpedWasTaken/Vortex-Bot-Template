import { PermissionFlagsBits, type GuildMember } from 'discord.js';
import type { AppConfig } from '../config/index.js';
import type { GuildSettingsDoc, PermissionLevel } from '../types/index.js';

function memberHasAdministrator(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function memberHasAnyRole(member: GuildMember, roleIds: string[]): boolean {
  if (roleIds.length === 0) return false;
  return member.roles.cache.some((role) => roleIds.includes(role.id));
}

/**
 * Vortex role hierarchy on top of Discord's native permissions.
 * Admins: Discord Administrator **or** configured admin roles (env + per-guild doc).
 * Moderators: admins **or** Manage Guild **or** configured mod roles.
 */
export function hasPermission(
  member: GuildMember | null,
  required: PermissionLevel,
  config: AppConfig,
  guildDoc: GuildSettingsDoc | null,
): boolean {
  if (!member) return false;
  if (required === 'user') return true;

  const adminRoles = [...config.permissions.adminRoleIds, ...(guildDoc?.adminRoleIds ?? [])];
  const modRoles = [...config.permissions.modRoleIds, ...(guildDoc?.modRoleIds ?? [])];

  const isAdmin = memberHasAdministrator(member) || memberHasAnyRole(member, adminRoles);
  const isModerator =
    isAdmin ||
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    memberHasAnyRole(member, modRoles);

  if (required === 'moderator') return isModerator;
  return isAdmin;
}
