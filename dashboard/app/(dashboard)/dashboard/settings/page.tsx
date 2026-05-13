import type { ReactElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isDashboardPasswordConfigured } from '@/lib/dashboard-password';
import { isEnvSet } from '@/lib/env-status';

export const dynamic = 'force-dynamic';

function flag(on: boolean): string {
  return on ? 'Configured' : 'Missing';
}

export default function SettingsPage(): ReactElement {
  const rows = [
    { label: 'Dashboard password', ok: isDashboardPasswordConfigured() },
    { label: 'Session signing secret', ok: isEnvSet('DASHBOARD_SESSION_SECRET') },
    { label: 'Control plane Postgres URL', ok: isEnvSet('CONTROL_PLANE_DATABASE_URL') },
    { label: 'Bot ingest secret', ok: isEnvSet('BOT_INGEST_SECRET') },
    { label: 'Stripe secret key', ok: isEnvSet('STRIPE_SECRET_KEY') },
    { label: 'Stripe webhook signing secret', ok: isEnvSet('STRIPE_WEBHOOK_SECRET') },
    { label: 'Stripe price (checkout)', ok: isEnvSet('STRIPE_PRICE_ID') },
    { label: 'Stripe customer (portal)', ok: isEnvSet('STRIPE_CUSTOMER_ID') },
    { label: 'Discord premium SKUs (display)', ok: isEnvSet('DISCORD_PREMIUM_SKU_IDS') },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Values are never printed here — only whether keys exist. Keep secrets in `.env.local`,
          Doppler, or Vercel environment groups.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment coverage</CardTitle>
          <CardDescription>Quick audit for local operators.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Integration</th>
                <th className="py-2 font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border/60">
                  <td className="py-2 pr-3">{row.label}</td>
                  <td className="py-2 text-foreground">{flag(row.ok)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
