'use client';

import { useState } from 'react';
import { CreditCard, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BillingCheckoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCheckout(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      const data: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Checkout failed';
        setError(message);
        return;
      }
      const url =
        typeof data === 'object' &&
        data !== null &&
        'url' in data &&
        typeof (data as { url: unknown }).url === 'string'
          ? (data as { url: string }).url
          : null;
      if (!url) {
        setError('Missing redirect URL from Stripe.');
        return;
      }
      window.location.href = url;
    } catch {
      setError('Network error while starting checkout.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" disabled={pending} onClick={() => void onCheckout()} className="gap-2">
        <CreditCard className="size-4" />
        {pending ? 'Redirecting…' : 'Start Stripe checkout'}
        <ExternalLink className="size-3.5 opacity-70" />
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function BillingPortalButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPortal(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Portal session failed';
        setError(message);
        return;
      }
      const url =
        typeof data === 'object' &&
        data !== null &&
        'url' in data &&
        typeof (data as { url: unknown }).url === 'string'
          ? (data as { url: string }).url
          : null;
      if (!url) {
        setError('Missing portal URL from Stripe.');
        return;
      }
      window.location.href = url;
    } catch {
      setError('Network error while opening the billing portal.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" disabled={pending} onClick={() => void onPortal()}>
        {pending ? 'Opening…' : 'Open customer portal'}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
