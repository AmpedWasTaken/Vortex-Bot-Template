import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ensureDashboardSession } from '@/lib/dashboard-route-auth';

export const runtime = 'nodejs';

export async function POST(): Promise<NextResponse> {
  const unauthorized = await ensureDashboardSession();
  if (unauthorized) return unauthorized;

  const secretKey = process.env['STRIPE_SECRET_KEY']?.trim();
  const customerId = process.env['STRIPE_CUSTOMER_ID']?.trim();
  const returnUrl =
    process.env['STRIPE_PORTAL_RETURN_URL']?.trim() ?? 'http://localhost:3100/dashboard/billing';

  if (!secretKey || !customerId) {
    return NextResponse.json(
      {
        error:
          'Stripe portal is not configured. Set STRIPE_SECRET_KEY and STRIPE_CUSTOMER_ID (map Discord users → Stripe customers in your own service).',
      },
      { status: 500 },
    );
  }

  const stripe = new Stripe(secretKey);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url });
}
