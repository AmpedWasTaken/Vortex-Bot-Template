import { SignJWT, jwtVerify } from 'jose';

function getSecretKey(): Uint8Array | null {
  const secret = process.env['DASHBOARD_SESSION_SECRET'];
  if (!secret || secret.length < 32) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

export function sanitizeNextPath(raw: string | undefined): string {
  if (!raw || typeof raw !== 'string') return '/dashboard';
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('..')) return '/dashboard';
  return raw;
}

export async function createOAuthStateJwt(nextPath: string): Promise<string | null> {
  const key = getSecretKey();
  if (!key) return null;
  const { randomUUID } = await import('node:crypto');
  return new SignJWT({ typ: 'vortex_oauth', n: randomUUID(), next: sanitizeNextPath(nextPath) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(key);
}

export async function verifyOAuthStateJwt(state: string): Promise<{ next: string } | null> {
  const key = getSecretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(state, key);
    if (payload['typ'] !== 'vortex_oauth' || typeof payload['next'] !== 'string') return null;
    return { next: sanitizeNextPath(payload['next']) };
  } catch {
    return null;
  }
}

export type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

export async function exchangeDiscordOAuthCode(code: string): Promise<DiscordTokenResponse | null> {
  const clientId = process.env['DISCORD_CLIENT_ID']?.trim();
  const clientSecret = process.env['DISCORD_CLIENT_SECRET']?.trim();
  const redirect = process.env['DISCORD_OAUTH_REDIRECT_URI']?.trim();
  if (!clientId || !clientSecret || !redirect) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirect,
  });

  const res = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  if (typeof data['access_token'] !== 'string' || typeof data['token_type'] !== 'string') return null;
  return {
    access_token: data['access_token'],
    token_type: String(data['token_type']),
    expires_in: typeof data['expires_in'] === 'number' ? data['expires_in'] : 0,
    refresh_token: typeof data['refresh_token'] === 'string' ? data['refresh_token'] : undefined,
    scope: typeof data['scope'] === 'string' ? data['scope'] : '',
  };
}

export type DiscordOauthProfile = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

export async function fetchDiscordMe(accessToken: string): Promise<DiscordOauthProfile | null> {
  const res = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as Record<string, unknown>;
  if (typeof j['id'] !== 'string' || typeof j['username'] !== 'string') return null;
  const gn = j['global_name'];
  const av = j['avatar'];
  return {
    id: j['id'],
    username: j['username'],
    global_name: typeof gn === 'string' ? gn : null,
    avatar: typeof av === 'string' ? av : null,
  };
}

export function getDiscordOAuthScopes(): string {
  const raw = process.env['DISCORD_OAUTH_SCOPES']?.trim();
  return raw || 'identify';
}

export function buildDiscordAuthorizeUrl(state: string): string | null {
  const clientId = process.env['DISCORD_CLIENT_ID']?.trim();
  const redirect = process.env['DISCORD_OAUTH_REDIRECT_URI']?.trim();
  if (!clientId || !redirect) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: 'code',
    scope: getDiscordOAuthScopes(),
    state,
    prompt: 'consent',
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
