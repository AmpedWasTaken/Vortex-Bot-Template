import { NextResponse } from 'next/server';
import { isDiscordAuthEnabled, isDiscordOAuthConfigured } from '@/lib/auth-modes';
import { buildDiscordAuthorizeUrl, createOAuthStateJwt, sanitizeNextPath } from '@/lib/discord-oauth';

export async function GET(request: Request): Promise<NextResponse> {
  if (!isDiscordAuthEnabled()) {
    return NextResponse.json({ error: 'Discord sign-in is disabled.' }, { status: 403 });
  }
  if (!isDiscordOAuthConfigured()) {
    return NextResponse.json(
      { error: 'Discord OAuth is not configured (client id, client secret, redirect URI).' },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const next = sanitizeNextPath(url.searchParams.get('next') ?? undefined);
  const state = await createOAuthStateJwt(next);
  if (!state) {
    return NextResponse.json(
      { error: 'DASHBOARD_SESSION_SECRET is missing or shorter than 32 characters.' },
      { status: 500 },
    );
  }

  const loc = buildDiscordAuthorizeUrl(state);
  if (!loc) {
    return NextResponse.json({ error: 'Discord OAuth configuration incomplete.' }, { status: 500 });
  }

  return NextResponse.redirect(loc);
}
