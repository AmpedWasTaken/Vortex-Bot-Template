import type { ReactElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { isEnvSet } from '@/lib/env-status';

export const dynamic = 'force-dynamic';

export default function IntegrationsPage(): ReactElement {
  const ingestConfigured = isEnvSet('BOT_INGEST_SECRET');
  const dbConfigured = isEnvSet('CONTROL_PLANE_DATABASE_URL');
  const exampleUrl = 'http://localhost:3100/api/integrations/bot-ingest';
  const stripeWebhookUrl = 'http://localhost:3100/api/webhooks/stripe';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Integrations</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Connect the Discord worker to this dashboard for entitlement snapshots, then extend the
          same pattern for webhooks, analytics sinks, or ticketing systems.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Postgres + migrations</CardTitle>
          <CardDescription>
            Status: {dbConfigured ? 'CONTROL_PLANE_DATABASE_URL is set.' : 'Database URL not set.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            From <code className="text-xs">dashboard/</code>, run{' '}
            <code className="text-xs">npm run db:migrate</code> after setting{' '}
            <code className="text-xs">CONTROL_PLANE_DATABASE_URL</code> (Neon, RDS, local Postgres,
            etc.).
          </p>
          <p>
            Create an operator API key:{' '}
            <code className="text-xs">npm run operator:create-key -- &quot;my-laptop&quot;</code> (scopes
            default to <code className="text-xs">telemetry:read</code>).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bot → dashboard ingest</CardTitle>
          <CardDescription>
            Status:{' '}
            {ingestConfigured
              ? 'Secret configured on this Next server.'
              : 'Missing `BOT_INGEST_SECRET`.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Set <code className="text-xs">BOT_INGEST_SECRET</code> in{' '}
              <code className="text-xs">dashboard/.env.local</code> and the same value in the
              worker&apos;s <code className="text-xs">BOT_INGEST_SECRET</code>.
            </li>
            <li>
              Point the worker at <code className="text-xs">DASHBOARD_INGEST_URL</code> (for example{' '}
              <code className="break-all text-xs">{exampleUrl}</code>).
            </li>
            <li>
              Restart both processes. Entitlement gateway events debounce to ~2s;{' '}
              <code className="text-xs">ready</code> sends an immediate snapshot.
            </li>
          </ol>
          <Separator />
          <p className="text-xs font-medium uppercase tracking-wide text-foreground">
            Manual smoke test
          </p>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs text-foreground">
            {`curl -X POST ${exampleUrl} \\
  -H "Authorization: Bearer $BOT_INGEST_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"guildCount":0,"premiumSkuIds":[],"entitlements":[]}'`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stripe webhooks</CardTitle>
          <CardDescription>Idempotent processing requires Postgres + `STRIPE_WEBHOOK_SECRET`.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Register endpoint:{' '}
            <code className="break-all text-xs">{stripeWebhookUrl}</code>
          </p>
          <p>
            Handlers included: <code className="text-xs">checkout.session.completed</code>,{' '}
            <code className="text-xs">customer.subscription.updated</code>,{' '}
            <code className="text-xs">customer.subscription.deleted</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operator REST</CardTitle>
          <CardDescription>Machine access for telemetry without the browser session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs text-foreground">
            {`curl -sS -H "Authorization: Bearer $VORTEX_OPERATOR_KEY" \\
  http://localhost:3100/api/operator/v1/health

curl -sS -H "Authorization: Bearer $VORTEX_OPERATOR_KEY" \\
  http://localhost:3100/api/operator/v1/telemetry`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where to extend</CardTitle>
          <CardDescription>Common integration seams for SaaS-style bots.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Forward structured logs to Datadog, Axiom, or Grafana Loki from the worker logger.
          </p>
          <p>
            • Add signed webhooks from Stripe (`checkout.session.completed`) to grant Discord
            entitlements server-side.
          </p>
          <p>
            • Expose a private REST API (mTLS or service tokens) for tenant admins to manage guild
            settings stored in Mongo/SQLite.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
