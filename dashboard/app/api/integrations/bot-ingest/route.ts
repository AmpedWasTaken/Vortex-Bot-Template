import { NextResponse } from 'next/server';
import { parseIngestBody, recordBotIngest } from '@/lib/bot-telemetry';

export const runtime = 'nodejs';

export function GET(): NextResponse {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env['BOT_INGEST_SECRET']?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: 'BOT_INGEST_SECRET is not configured on the dashboard.' },
      { status: 500 },
    );
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Invalid authorization' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseIngestBody(body);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid ingest payload' }, { status: 400 });
  }

  recordBotIngest(parsed);
  return NextResponse.json({ ok: true });
}
