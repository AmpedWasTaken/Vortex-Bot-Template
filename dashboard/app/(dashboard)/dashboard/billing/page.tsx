import type { ReactElement } from 'react';
import Link from 'next/link';
import { BillingCheckoutButton, BillingPortalButton } from '@/components/billing-actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { isEnvSet, parseCsvSkus } from '@/lib/env-status';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BillingPage({ searchParams }: PageProps): Promise<ReactElement> {
  const sp = searchParams ? await searchParams : {};
  const checkoutRaw = sp['checkout'];
  const checkout = Array.isArray(checkoutRaw) ? checkoutRaw[0] : checkoutRaw;

  const stripeCheckoutReady = isEnvSet('STRIPE_SECRET_KEY') && isEnvSet('STRIPE_PRICE_ID');
  const stripePortalReady = isEnvSet('STRIPE_SECRET_KEY') && isEnvSet('STRIPE_CUSTOMER_ID');
  const skus = parseCsvSkus(process.env['DISCORD_PREMIUM_SKU_IDS']);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Billing & monetization</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Pair <strong>Discord Application Entitlements</strong> (SKU-based access inside Discord)
          with <strong>Stripe</strong> for operator-facing web billing. Map purchasers to Stripe
          customers in your own API — this template only wires the happy-path API routes.
        </p>
      </div>

      {checkout === 'success' ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
          Stripe checkout completed. Grant Discord entitlements from your backend webhook or manual
          fulfillment flow.
        </div>
      ) : null}
      {checkout === 'cancel' ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Checkout canceled — no charges were finalized.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Discord SKUs
              <Badge variant="outline">{skus.length} configured</Badge>
            </CardTitle>
            <CardDescription>
              Mirror the comma-separated list from the worker&apos;s{' '}
              <code className="text-xs">PREMIUM_SKU_IDS</code> into{' '}
              <code className="text-xs">DISCORD_PREMIUM_SKU_IDS</code> here for operator visibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {skus.length === 0 ? (
              <p>
                Set `DISCORD_PREMIUM_SKU_IDS` in `dashboard/.env.local` to list premium SKUs for
                this console.
              </p>
            ) : (
              <ul className="space-y-2">
                {skus.map((sku) => (
                  <li key={sku} className="font-mono text-xs text-foreground">
                    {sku}
                  </li>
                ))}
              </ul>
            )}
            <Separator />
            <p>
              Docs:{' '}
              <Link
                className="text-primary underline-offset-4 hover:underline"
                href="https://discord.com/developers/docs/monetization/entitlements"
              >
                Discord Entitlements
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stripe</CardTitle>
            <CardDescription>
              Checkout sessions require <code className="text-xs">STRIPE_PRICE_ID</code>. Customer
              portal requires a mapped <code className="text-xs">STRIPE_CUSTOMER_ID</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              <Badge variant={stripeCheckoutReady ? 'default' : 'secondary'}>
                Checkout {stripeCheckoutReady ? 'ready' : 'needs env'}
              </Badge>
              <Badge variant={stripePortalReady ? 'default' : 'secondary'}>
                Portal {stripePortalReady ? 'ready' : 'needs env'}
              </Badge>
            </div>
            {stripeCheckoutReady ? <BillingCheckoutButton /> : null}
            {stripePortalReady ? <BillingPortalButton /> : null}
            {!stripeCheckoutReady && !stripePortalReady ? (
              <p>
                Add `STRIPE_SECRET_KEY` plus `STRIPE_PRICE_ID` and/or `STRIPE_CUSTOMER_ID` to
                `dashboard/.env.local`, then reload this page.
              </p>
            ) : null}
            <Separator />
            <p>
              Stripe docs:{' '}
              <Link
                className="text-primary underline-offset-4 hover:underline"
                href="https://docs.stripe.com/checkout/quickstart"
              >
                Checkout
              </Link>{' '}
              ·{' '}
              <Link
                className="text-primary underline-offset-4 hover:underline"
                href="https://docs.stripe.com/customer-management/integrate-customer-portal"
              >
                Customer portal
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
