import { NextResponse } from 'next/server';
import { getBotTelemetry } from '@/lib/bot-telemetry';
import { requireOperatorScopes } from '@/lib/operator-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireOperatorScopes(request, ['telemetry:read']);
  if (!auth.ok) return auth.response;

  const data = await getBotTelemetry();
  return NextResponse.json({
    persistence: data.persistence,
    snapshot: data.snapshot,
    activity: data.activity,
  });
}
