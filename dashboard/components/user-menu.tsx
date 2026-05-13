'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ReactElement } from 'react';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu(): ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const signOut = (): void => {
    setError(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (!response.ok) {
          setError('Unable to sign out.');
          return;
        }
        router.replace('/login');
        router.refresh();
      })();
    });
  };

  return (
    <div className="flex items-center gap-3">
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={pending}>
            <User className="size-4" />
            Account
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Session</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>Signed in</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={signOut} className="gap-2 text-destructive focus:text-destructive">
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
