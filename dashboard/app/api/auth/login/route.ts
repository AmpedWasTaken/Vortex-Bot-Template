import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';
import { isDashboardPasswordConfigured, verifyDashboardPassword } from '@/lib/dashboard-password';

export async function POST(request: Request): Promise<NextResponse> {
  if (!isDashboardPasswordConfigured()) {
    return NextResponse.json(
      { error: 'Dashboard password is not configured. Set DASHBOARD_PASSWORD in dashboard/.env.local.' },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const password =
    typeof body === 'object' &&
    body !== null &&
    'password' in body &&
    typeof (body as { password: unknown }).password === 'string'
      ? (body as { password: string }).password
      : '';

  if (!verifyDashboardPassword(password)) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
