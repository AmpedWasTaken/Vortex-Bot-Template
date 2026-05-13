'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginFormProps = {
  nextPath: string;
  disabled?: boolean;
};

export function LoginForm({ nextPath, disabled }: LoginFormProps): ReactElement {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? 'Unable to sign in.');
          return;
        }
        router.replace(nextPath);
        router.refresh();
      })();
    });
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          disabled={disabled || pending}
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full gap-2" disabled={disabled || pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </form>
  );
}
