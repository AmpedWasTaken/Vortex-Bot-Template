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

  try {
    await recordBotIngest(parsed);
  } catch (err: unknown) {
    console.error('[bot-ingest] persistence failed', err);
    const code =
      typeof err === 'object' && err !== null && 'code' in err && typeof (err as { code: unknown }).code === 'string'
        ? (err as { code: string }).code
        : undefined;
    const message = err instanceof Error ? err.message : String(err);

    if (code === '42703' || code === '42P01' || /column .*guild|relation .*bot_ingest/i.test(message)) {
      return NextResponse.json(
        {
          error:
            'Control plane schema is missing columns or tables. From the dashboard folder run: npm run db:migrate (applies 002_guild_ingest.sql and earlier migrations).',
          code,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: 'Ingest persistence failed',
        ...(process.env['NODE_ENV'] !== 'production' ? { detail: message, code } : {}),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
