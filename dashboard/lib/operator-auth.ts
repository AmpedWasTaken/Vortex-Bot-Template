import { NextResponse } from 'next/server';
import { parseBearerToken, verifyServiceApiKey } from '@/lib/service-keys';

export async function requireValidOperatorKey(
  request: Request,
): Promise<
  | { ok: true; keyId: string; name: string; scopes: string[] }
  | { ok: false; response: NextResponse }
> {
  const token = parseBearerToken(request.headers.get('authorization'));
  const row = await verifyServiceApiKey(token);
  if (!row) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { ok: true, keyId: row.id, name: row.name, scopes: row.scopes };
}

export async function requireOperatorScopes(
  request: Request,
  required: readonly string[],
): Promise<
  | { ok: true; keyId: string; name: string; scopes: string[] }
  | { ok: false; response: NextResponse }
> {
  const base = await requireValidOperatorKey(request);
  if (!base.ok) return base;
  for (const scope of required) {
    if (!base.scopes.includes(scope)) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Forbidden', missing: scope }, { status: 403 }),
      };
    }
  }
  return base;
}
