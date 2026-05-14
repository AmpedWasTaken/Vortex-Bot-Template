'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ReactElement } from 'react';
import { LogOut, User } from 'lucide-react';
import type { DashboardPrincipal } from '@/lib/session';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type UserMenuProps = {
  principal: DashboardPrincipal;
};

export function UserMenu({ principal }: UserMenuProps): ReactElement {
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

  const isDiscord = principal.kind === 'discord';
  const label = isDiscord
    ? principal.discord.globalName ?? principal.discord.username
    : 'Password session';
  const sublabel = isDiscord ? `@${principal.discord.username}` : 'Signed in';
  const avatarUrl =
    isDiscord && principal.discord.avatar
      ? `https://cdn.discordapp.com/avatars/${principal.discord.id}/${principal.discord.avatar}.png?size=64`
      : null;

  return (
    <div className="flex items-center gap-3">
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={pending}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Discord CDN
              <img src={avatarUrl} alt="" className="size-5 rounded-full" width={20} height={20} />
            ) : (
              <User className="size-4" />
            )}
            Account
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="space-y-1 font-normal">
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="size-8 rounded-full" width={32} height={32} />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{label}</p>
                <p className="truncate text-xs text-muted-foreground">{sublabel}</p>
              </div>
            </div>
          </DropdownMenuLabel>
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
