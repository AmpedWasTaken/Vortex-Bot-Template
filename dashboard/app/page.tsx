import Link from 'next/link';
import type { ReactElement } from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage(): ReactElement {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-6">
          <Badge variant="secondary" className="gap-1">
            <Shield className="size-3.5" />
            shadcn/ui + Next.js 15
          </Badge>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Vortex Bot Template</p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Operator dashboard starter, wired for SaaS control planes.
            </h1>
            <p className="text-pretty text-sm text-muted-foreground md:text-base">
              Sign in to access the protected shell. Swap the password gate for Clerk, Auth.js, or your API gateway
              when you are ready for production tenants.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/login">
                Sign in to dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </div>
        </div>

        <Card className="w-full max-w-md border-border/80 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur">
          <CardHeader>
            <CardTitle>What ships here</CardTitle>
            <CardDescription>Drop-in modules you can extend without touching the Discord runtime.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>JWT session cookie, middleware route protection, and a sidebar shell ready for billing hooks.</p>
            <p>Bot process still lives in the repository root — this app is your premium-facing surface.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
