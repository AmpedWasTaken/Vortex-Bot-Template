import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getBotTelemetry } from '@/lib/bot-telemetry';

export const dynamic = 'force-dynamic';

export default function TelemetryPage(): ReactElement {
  const { snapshot, activity } = getBotTelemetry();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Telemetry</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Entitlement rows arrive from the Discord worker via{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            POST /api/integrations/bot-ingest
          </code>
          . This view is backed by an in-process store suitable for single-node demos — swap in
          Redis or a database for production.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Entitlements</CardTitle>
            <CardDescription>
              {snapshot
                ? `${String(snapshot.entitlements.length)} row(s) · last reason: ${snapshot.reason ?? 'n/a'}`
                : 'Waiting for the first ingest from the bot.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {snapshot && snapshot.entitlements.length > 0 ? (
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">SKU</th>
                    <th className="py-2 pr-3 font-medium">User</th>
                    <th className="py-2 pr-3 font-medium">Guild</th>
                    <th className="py-2 pr-3 font-medium">Active</th>
                    <th className="py-2 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.entitlements.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-mono text-xs">{row.skuId}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{row.userId}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{row.guildId ?? '—'}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={row.isActive ? 'default' : 'secondary'}>
                          {row.isActive ? 'yes' : 'no'}
                        </Badge>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {[row.deleted && 'deleted', row.consumed && 'consumed']
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No entitlement rows yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Recent ingest events (memory-only).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {activity.length === 0 ? (
              <p className="text-muted-foreground">No activity yet.</p>
            ) : (
              activity.map((row, index) => (
                <div
                  key={`${row.at}-${String(index)}`}
                  className="rounded-md border border-border/60 p-3"
                >
                  <p className="text-xs text-muted-foreground">
                    {new Date(row.at).toLocaleString()}
                  </p>
                  <p className="font-medium">{row.label}</p>
                </div>
              ))
            )}
            <Separator />
            <p className="text-xs text-muted-foreground">
              Node env from bot: <span className="font-mono">{snapshot?.nodeEnv ?? '—'}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
