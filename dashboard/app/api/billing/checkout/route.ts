import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ensureDashboardSession } from '@/lib/dashboard-route-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const METADATA_ALLOWLIST = ['discord_user_id', 'discord_guild_id', 'sku_id'] as const;

export async function POST(request: Request): Promise<NextResponse> {
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

  const metadata: Record<string, string> = {};
  try {
    const body: unknown = await request.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const rawMeta = (body as { metadata?: unknown }).metadata;
      if (rawMeta && typeof rawMeta === 'object' && !Array.isArray(rawMeta)) {
        for (const key of METADATA_ALLOWLIST) {
          const v = (rawMeta as Record<string, unknown>)[key];
          if (typeof v === 'string' && v.trim()) {
            metadata[key] = v.trim();
          }
        }
      }
    }
  } catch {
    /* empty body is fine */
  }

  const stripe = new Stripe(secretKey);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
