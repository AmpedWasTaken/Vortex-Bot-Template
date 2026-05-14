import { NextResponse } from 'next/server';
import { isDiscordAuthEnabled, isDiscordOAuthConfigured } from '@/lib/auth-modes';
import { assertDiscordDashboardAccess } from '@/lib/discord-access';
import { exchangeDiscordOAuthCode, fetchDiscordMe, verifyOAuthStateJwt } from '@/lib/discord-oauth';
import { SESSION_COOKIE, createDiscordSessionToken } from '@/lib/session';

export async function GET(request: Request): Promise<NextResponse> {
  if (!isDiscordAuthEnabled()) {
    return new NextResponse('Discord sign-in is disabled.', { status: 403, headers: { 'Content-Type': 'text/plain' } });
  }
  if (!isDiscordOAuthConfigured()) {
    return new NextResponse('Discord OAuth is not configured.', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  const url = new URL(request.url);
  const oauthErr = url.searchParams.get('error');
  if (oauthErr) {
    const desc = url.searchParams.get('error_description') ?? oauthErr;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(desc)}`, url.origin).toString(),
    );
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    return NextResponse.redirect('/login?error=' + encodeURIComponent('Missing OAuth code or state.'));
  }

  const verified = await verifyOAuthStateJwt(state);
  if (!verified) {
    return NextResponse.redirect('/login?error=' + encodeURIComponent('Invalid or expired OAuth state.'));
  }

  const tokens = await exchangeDiscordOAuthCode(code);
  if (!tokens) {
    return NextResponse.redirect('/login?error=' + encodeURIComponent('Could not exchange authorization code.'));
  }

  const me = await fetchDiscordMe(tokens.access_token);
  if (!me) {
    return NextResponse.redirect('/login?error=' + encodeURIComponent('Could not load Discord profile.'));
  }

  const gate = await assertDiscordDashboardAccess({
    userId: me.id,
    accessToken: tokens.access_token,
    grantedScope: tokens.scope,
  });
  if (!gate.ok) {
    return NextResponse.redirect(
      `/login?next=${encodeURIComponent(verified.next)}&error=${encodeURIComponent(gate.message)}`,
    );
  }

  const sessionJwt = await createDiscordSessionToken(me);
  const res = NextResponse.redirect(new URL(verified.next, url.origin).toString());
  res.cookies.set({
    name: SESSION_COOKIE,
    value: sessionJwt,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
