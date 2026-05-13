import type { ReactElement } from 'react';
import { Activity, Bot, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function DashboardHome(): ReactElement {
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
          This surface is intentionally minimal. Add data fetching, charts, and tenant management routes without
          touching the Discord worker in the repository root.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bot status</CardTitle>
            <Bot className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">Online</div>
            <p className="text-xs text-muted-foreground">Wire to `/health` or PM2 metrics.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active guilds</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">—</div>
            <p className="text-xs text-muted-foreground">Connect Mongo + cache counts here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">$0</div>
            <p className="text-xs text-muted-foreground">Drop in Stripe billing webhooks.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>High leverage upgrades for a SaaS-grade control plane.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Replace the password gate with Auth.js, Clerk, or your API gateway JWT.</p>
          <Separator />
          <p>Add route handlers under `app/api` for bot telemetry, entitlements, and audit logs.</p>
        </CardContent>
      </Card>
    </div>
  );
}
