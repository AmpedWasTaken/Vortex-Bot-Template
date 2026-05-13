import type { ReactElement } from 'react';
import Link from 'next/link';
import { Activity, Bot, CreditCard, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getBotTelemetry } from '@/lib/bot-telemetry';

export const dynamic = 'force-dynamic';

export default async function DashboardHome(): Promise<ReactElement> {
  const { snapshot, persistence } = await getBotTelemetry();
  const activeEntitlements =
    snapshot?.entitlements.filter((e) => e.isActive && !e.deleted).length ?? null;
  const lastSync = snapshot?.receivedAt ? new Date(snapshot.receivedAt).toLocaleString() : 'Never';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="size-3.5" />
            Authenticated
          </Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          This control plane pairs with the Discord worker: ingest snapshots for entitlements, wire
          Stripe for web billing, and keep integrations documented for your fork. Telemetry persistence:{' '}
          <span className="font-mono text-foreground">{persistence}</span>
          {persistence === 'memory' ? ' (set CONTROL_PLANE_DATABASE_URL + run db:migrate).' : '.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bot snapshot</CardTitle>
            <Bot className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{snapshot ? 'Receiving' : 'Idle'}</div>
            <p className="text-xs text-muted-foreground">Last ingest: {lastSync}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guilds (from bot)</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {snapshot ? String(snapshot.guildCount) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires `DASHBOARD_INGEST_URL` on the worker.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active entitlements</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {activeEntitlements === null ? '—' : String(activeEntitlements)}
            </div>
            <p className="text-xs text-muted-foreground">
              Discord SKUs mirrored from the worker cache.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>
            Production hardening paths that stay compatible with this template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Replace the password gate with Auth.js, Clerk, or your API gateway JWT. When
            `CONTROL_PLANE_DATABASE_URL` is set, ingest snapshots, Stripe webhook idempotency, audit
            rows, and operator API keys are stored in Postgres; otherwise telemetry falls back to
            in-memory mode for local demos only.
          </p>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/telemetry">Open telemetry</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/billing">Configure billing</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/integrations">Wire integrations</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
