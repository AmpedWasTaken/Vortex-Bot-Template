'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Activity, Building2, CreditCard, LayoutGrid, Menu, Plug, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { href: '/dashboard/guilds', label: 'Guilds', icon: Building2 },
  { href: '/dashboard/telemetry', label: 'Telemetry', icon: Activity },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
] as const;

export function DashboardMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(100%,20rem)] gap-0 p-0">
          <SheetHeader className="border-b border-border p-4 text-left">
            <SheetTitle className="text-base">Navigation</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Button key={href} asChild variant="ghost" className="justify-start gap-2">
                <Link href={href} onClick={() => setOpen(false)}>
                  <Icon className="size-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
