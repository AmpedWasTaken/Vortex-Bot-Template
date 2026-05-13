import { NextResponse } from 'next/server';
import { getControlPlaneSql } from '@/lib/db';
import { requireValidOperatorKey } from '@/lib/operator-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireValidOperatorKey(request);
  if (!auth.ok) return auth.response;

  const sql = getControlPlaneSql();
  return NextResponse.json({
    ok: true,
    database: sql ? 'connected' : 'not_configured',
    key: { id: auth.keyId, name: auth.name },
  });
}
