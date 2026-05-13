import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'vortex_dashboard';

function getSecretKey(): Uint8Array | null {
  const secret = process.env['DASHBOARD_SESSION_SECRET'];
  if (!secret || secret.length < 32) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(): Promise<string> {
  const key = getSecretKey();
  if (!key) {
    throw new Error('DASHBOARD_SESSION_SECRET must be set to at least 32 characters.');
  }

  return new SignJWT({ scope: 'dashboard' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const key = getSecretKey();
  if (!key) return false;
  try {
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}
