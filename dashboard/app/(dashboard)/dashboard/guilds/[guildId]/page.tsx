import Link from 'next/link';
import type { ReactElement } from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getBotTelemetry, snapshotGuildSettingsFor, snapshotGuilds } from '@/lib/bot-telemetry';

export const dynamic = 'force-dynamic';

type GuildDetailPageProps = {
  params: Promise<{ guildId: string }>;
};

export default async function GuildDetailPage(props: GuildDetailPageProps): Promise<ReactElement> {
  const { guildId } = await props.params;
  const { snapshot, persistence } = await getBotTelemetry();
  const guilds = snapshotGuilds(snapshot);
  const meta = guilds.find((g) => g.id === guildId) ?? null;
  const settings = snapshotGuildSettingsFor(snapshot, guildId);

  const entForGuild =
    snapshot?.entitlements.filter((e) => e.guildId === guildId || e.guildId === null) ?? [];
  const entGuildScoped = snapshot?.entitlements.filter((e) => e.guildId === guildId) ?? [];

  const hasAnySignal = Boolean(meta || settings || entGuildScoped.length > 0);
  if (snapshot && !hasAnySignal) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/guilds">
            <ArrowLeft className="size-4" />
            Guilds
          </Link>
        </Button>
        <Badge variant="secondary">Read-only</Badge>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          {meta?.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://cdn.discordapp.com/icons/${meta.id}/${meta.icon}.png?size=64`}
              alt=""
              className="size-12 rounded-lg"
              width={48}
              height={48}
            />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <Hash className="size-6 text-muted-foreground" />
            </span>
          )}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{meta?.name ?? 'Unknown guild'}</h1>
            <p className="font-mono text-sm text-muted-foreground">{guildId}</p>
          </div>
        </div>
        {!meta ? (
          <p className="max-w-3xl text-sm text-amber-600 dark:text-amber-400">
            This guild id is not in the latest capped ingest directory. If the bot serves more than 200
            guilds, open an issue or raise the cap. Entitlements and settings below still reflect rows tied
            to this id when present.
          </p>
        ) : null}
        <p className="max-w-3xl text-sm text-muted-foreground">
          Data is mirrored from the worker ingest (not live Discord). Persistence:{' '}
          <span className="font-mono">{persistence}</span>.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Guild settings (mirror)</CardTitle>
            <CardDescription>
              Sourced from <span className="font-mono">guildSettings</span> in ingest — same fields as{' '}
              <span className="font-mono">GuildSettings</span> in the bot database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {settings ? (
              <>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mod roles</p>
                  <p className="font-mono text-xs break-all">{settings.modRoleIds.join(', ') || '—'}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin roles</p>
                  <p className="font-mono text-xs break-all">{settings.adminRoleIds.join(', ') || '—'}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Log channel</p>
                  <p className="font-mono text-xs">{settings.logChannelId ?? '—'}</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                No settings row for this guild in the last snapshot. The bot may not have pushed yet, or
                this guild was outside the ingest cap.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entitlements</CardTitle>
            <CardDescription>
              Rows scoped to this guild, plus <strong>guild-null</strong> rows (application-wide SKUs)
              that may still apply depending on your Discord configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {entForGuild.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entitlement rows for this guild.</p>
            ) : (
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">SKU</th>
                    <th className="py-2 pr-2 font-medium">User</th>
                    <th className="py-2 pr-2 font-medium">Guild</th>
                    <th className="py-2 font-medium">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {entForGuild.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-2 font-mono text-xs">{row.skuId}</td>
                      <td className="py-2 pr-2 font-mono text-xs">{row.userId}</td>
                      <td className="py-2 pr-2 font-mono text-xs">{row.guildId ?? '∅'}</td>
                      <td className="py-2">{row.isActive ? 'yes' : 'no'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
