import { NextResponse } from 'next/server';
import type { JSONValue } from 'postgres';
import Stripe from 'stripe';
import { insertAudit } from '@/lib/audit';
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionLifecycle,
} from '@/lib/fulfillment-stripe';
import { getControlPlaneSql } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const sql = getControlPlaneSql();
  if (!sql) {
    return NextResponse.json(
      {
        error:
          'CONTROL_PLANE_DATABASE_URL is required for Stripe webhooks (idempotency + fulfillment records).',
      },
      { status: 503 },
    );
  }

  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']?.trim();
  const stripeSecretKey = process.env['STRIPE_SECRET_KEY']?.trim();
  if (!webhookSecret || !stripeSecretKey) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY must be set.' },
      { status: 500 },
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe-Signature header.' }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = new Stripe(stripeSecretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 });
  }

  try {
    await sql.begin(async (tx) => {
      const payload = JSON.parse(JSON.stringify(event)) as JSONValue;
      const inserted = await tx<{ id: string }[]>`
        INSERT INTO stripe_webhook_events (id, type, livemode, payload)
        VALUES (${event.id}, ${event.type}, ${event.livemode}, ${tx.json(payload)})
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      if (inserted.length === 0) {
        return;
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(tx, session);
      } else if (event.type === 'customer.subscription.updated') {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionLifecycle(tx, sub, 'stripe.subscription.updated');
      } else if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionLifecycle(tx, sub, 'stripe.subscription.deleted');
      }

      await insertAudit(
        {
          actor: 'stripe',
          action: 'stripe.webhook.processed',
          meta: { type: event.type, id: event.id },
        },
        tx,
      );

      await tx`
        UPDATE stripe_webhook_events SET processed_at = now() WHERE id = ${event.id}
      `;
    });
  } catch (error) {
    console.error('[stripe webhook]', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
