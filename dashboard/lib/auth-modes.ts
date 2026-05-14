export type DashboardAuthMode = 'password' | 'discord';

function splitModes(raw: string | undefined): DashboardAuthMode[] {
  if (!raw?.trim()) return ['password'];
  const parts = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const out = new Set<DashboardAuthMode>();
  for (const p of parts) {
    if (p === 'password' || p === 'discord') out.add(p);
  }
  if (out.size === 0) return ['password'];
  return [...out];
}

/** Comma-separated `password`, `discord` (default: password only). */
export function getDashboardAuthModes(): DashboardAuthMode[] {
  return splitModes(process.env['DASHBOARD_AUTH_MODES']);
}

export function isPasswordAuthEnabled(): boolean {
  return getDashboardAuthModes().includes('password');
}

export function isDiscordAuthEnabled(): boolean {
  return getDashboardAuthModes().includes('discord');
}

export function isDiscordOAuthConfigured(): boolean {
  const id = process.env['DISCORD_CLIENT_ID']?.trim();
  const secret = process.env['DISCORD_CLIENT_SECRET']?.trim();
  const redirect = process.env['DISCORD_OAUTH_REDIRECT_URI']?.trim();
  return Boolean(id && secret && redirect);
}

export function isDashboardSessionSecretConfigured(): boolean {
  const s = process.env['DASHBOARD_SESSION_SECRET'];
  return Boolean(s && s.length >= 32);
}

/** Discord sign-in can run (OAuth app + redirect + signing secret for state/session JWT). */
export function isDiscordLoginOperational(): boolean {
  return isDiscordOAuthConfigured() && isDashboardSessionSecretConfigured();
}
