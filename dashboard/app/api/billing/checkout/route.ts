import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ensureDashboardSession } from '@/lib/dashboard-route-auth';

export const runtime = 'nodejs';

export async function POST(): Promise<NextResponse> {
  const unauthorized = await ensureDashboardSession();
  if (unauthorized) return unauthorized;

  const secretKey = process.env['STRIPE_SECRET_KEY']?.trim();
  const priceId = process.env['STRIPE_PRICE_ID']?.trim();
  const successUrl =
    process.env['STRIPE_SUCCESS_URL']?.trim() ??
    'http://localhost:3100/dashboard/billing?checkout=success';
  const cancelUrl =
    process.env['STRIPE_CANCEL_URL']?.trim() ??
    'http://localhost:3100/dashboard/billing?checkout=cancel';

  if (!secretKey || !priceId) {
    return NextResponse.json(
      {
        error:
          'Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID in dashboard/.env.local.',
      },
      { status: 500 },
    );
  }

  const stripe = new Stripe(secretKey);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
