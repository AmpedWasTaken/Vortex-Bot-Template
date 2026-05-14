import Link from 'next/link';
import type { ReactElement } from 'react';
import { Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBotTelemetry, snapshotGuilds } from '@/lib/bot-telemetry';

export const dynamic = 'force-dynamic';

export default async function GuildsPage(): Promise<ReactElement> {
  const { snapshot, persistence } = await getBotTelemetry();
  const guilds = snapshotGuilds(snapshot);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Guilds</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Directory and settings mirror come from the latest bot ingest (capped at 200 guilds per snapshot).
          Persistence: <span className="font-mono">{persistence}</span>
          {persistence === 'memory' ? ' — run migrations with Postgres for durable history.' : null}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Servers in last snapshot</CardTitle>
          <CardDescription>
            {snapshot
              ? `${guilds.length} guild(s) in payload · worker reports ${snapshot.guildCount} total.`
              : 'No ingest yet. Set DASHBOARD_INGEST_URL on the bot and BOT_INGEST_SECRET on both sides.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {guilds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to list yet.</p>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Guild</th>
                  <th className="py-2 pr-3 font-medium">Id</th>
                  <th className="py-2 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {guilds.map((g) => (
                  <tr key={g.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        {g.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=48`}
                            alt=""
                            className="size-8 rounded-md"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <span className="flex size-8 items-center justify-center rounded-md bg-muted">
                            <Hash className="size-4 text-muted-foreground" />
                          </span>
                        )}
                        <span className="font-medium text-foreground">{g.name}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{g.id}</td>
                    <td className="py-2 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/guilds/${g.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
