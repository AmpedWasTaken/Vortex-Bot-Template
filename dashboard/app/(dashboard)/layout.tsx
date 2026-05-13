import Link from 'next/link';
import { cookies } from 'next/headers';
import type { ReactElement, ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Activity, CreditCard, LayoutGrid, Plug, Settings } from 'lucide-react';
import { DashboardMobileNav } from '@/components/dashboard-mobile-nav';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { UserMenu } from '@/components/user-menu';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    redirect('/login?next=/dashboard');
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="space-y-1 p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Vortex
          </p>
          <div className="text-lg font-semibold tracking-tight text-sidebar-foreground">
            Control Plane
          </div>
          <Badge variant="secondary" className="mt-2 w-fit text-[0.65rem]">
            Protected
          </Badge>
        </div>
        <Separator />
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="flex flex-col gap-1">
            <Button asChild variant="ghost" className="justify-start gap-2 text-sidebar-foreground">
              <Link href="/dashboard">
                <LayoutGrid className="size-4" />
                Overview
              </Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start gap-2 text-sidebar-foreground">
              <Link href="/dashboard/telemetry">
                <Activity className="size-4" />
                Telemetry
              </Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start gap-2 text-sidebar-foreground">
              <Link href="/dashboard/billing">
                <CreditCard className="size-4" />
                Billing
              </Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start gap-2 text-sidebar-foreground">
              <Link href="/dashboard/integrations">
                <Plug className="size-4" />
                Integrations
              </Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start gap-2 text-sidebar-foreground">
              <Link href="/dashboard/settings">
                <Settings className="size-4" />
                Settings
              </Link>
            </Button>
          </nav>
        </ScrollArea>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <DashboardMobileNav />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Live workspace
              </p>
              <p className="truncate text-sm font-semibold">Operator console</p>
            </div>
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
