import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { DiscordOauthProfile } from '@/lib/discord-oauth';

export const SESSION_COOKIE = 'vortex_dashboard';

function getSecretKey(): Uint8Array | null {
  const secret = process.env['DASHBOARD_SESSION_SECRET'];
  if (!secret || secret.length < 32) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

export type DashboardPrincipal =
  | { kind: 'password' }
  | {
      kind: 'discord';
      discord: {
        id: string;
        username: string;
        globalName: string | null;
        avatar: string | null;
      };
    };

function readAmr(payload: Record<string, unknown>): 'password' | 'discord' {
  const amr = payload['amr'];
  if (Array.isArray(amr) && amr.includes('discord')) return 'discord';
  if (Array.isArray(amr) && amr.includes('password')) return 'password';
  return 'password';
}

export async function createSessionToken(): Promise<string> {
  const key = getSecretKey();
  if (!key) {
    throw new Error('DASHBOARD_SESSION_SECRET must be set to at least 32 characters.');
  }

  return new SignJWT({ scope: 'dashboard', amr: ['password'] })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function createDiscordSessionToken(profile: DiscordOauthProfile): Promise<string> {
  const key = getSecretKey();
  if (!key) {
    throw new Error('DASHBOARD_SESSION_SECRET must be set to at least 32 characters.');
  }

  return new SignJWT({
    scope: 'dashboard',
    amr: ['discord'],
    sub: profile.id,
    dusr: profile.username,
    dgn: profile.global_name,
    dav: profile.avatar,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifySessionAndDecode(
  token: string | undefined,
): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  const key = getSecretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (payload['scope'] !== 'dashboard') return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const p = await verifySessionAndDecode(token);
  return p !== null;
}

export async function getDashboardPrincipal(tokenOverride?: string | undefined): Promise<DashboardPrincipal | null> {
  const token =
    tokenOverride !== undefined
      ? tokenOverride
      : (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySessionAndDecode(token);
  if (!payload) return null;
  if (readAmr(payload) === 'discord' && typeof payload['sub'] === 'string') {
    return {
      kind: 'discord',
      discord: {
        id: payload['sub'],
        username: typeof payload['dusr'] === 'string' ? payload['dusr'] : 'user',
        globalName:
          typeof payload['dgn'] === 'string' || payload['dgn'] === null ? (payload['dgn'] as string | null) : null,
        avatar:
          typeof payload['dav'] === 'string' || payload['dav'] === null ? (payload['dav'] as string | null) : null,
      },
    };
  }
  return { kind: 'password' };
}
