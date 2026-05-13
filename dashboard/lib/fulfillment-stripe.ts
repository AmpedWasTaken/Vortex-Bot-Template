import type { JSONValue } from 'postgres';
import type Stripe from 'stripe';
import type { PgClient } from '@/lib/db';
import { insertAudit } from '@/lib/audit';

function metaString(meta: Stripe.Metadata | null | undefined, key: string): string | undefined {
  const v = meta?.[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/**
 * Template hook: map Stripe Checkout metadata → Discord fulfillment.
 * Expect `discord_user_id` (and optionally `discord_guild_id`, `sku_id`) on the Checkout Session.
 * Replace with Discord REST calls (entitlements / roles) in your deployment.
 */
export async function handleCheckoutSessionCompleted(
  sql: PgClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const discordUserId = metaString(session.metadata, 'discord_user_id');
  const discordGuildId = metaString(session.metadata, 'discord_guild_id');
  const skuId = metaString(session.metadata, 'sku_id');

  const checkoutMeta = {
    mode: session.mode,
    customer: session.customer,
    subscription: session.subscription,
    discordUserId: discordUserId ?? null,
    discordGuildId: discordGuildId ?? null,
    skuId: skuId ?? null,
  } as JSONValue;

  await sql`
    INSERT INTO fulfillment_records (source, source_id, state, meta)
    VALUES (
      ${'stripe_checkout'},
      ${session.id},
      ${'recorded'},
      ${sql.json(checkoutMeta)}
    )
    ON CONFLICT (source, source_id) DO UPDATE SET
      state = EXCLUDED.state,
      meta = EXCLUDED.meta,
      updated_at = now()
  `;

  await insertAudit(
    {
      actor: 'stripe',
      action: 'fulfillment.checkout.recorded',
      meta: {
        sessionId: session.id,
        discordUserId: discordUserId ?? null,
        discordGuildId: discordGuildId ?? null,
        skuId: skuId ?? null,
      },
    },
    sql,
  );
}

export async function handleSubscriptionLifecycle(
  sql: PgClient,
  subscription: Stripe.Subscription,
  action: 'stripe.subscription.updated' | 'stripe.subscription.deleted',
): Promise<void> {
  const subMeta = {
    customer: subscription.customer,
    status: subscription.status,
  } as JSONValue;

  await sql`
    INSERT INTO fulfillment_records (source, source_id, state, meta)
    VALUES (
      ${'stripe_subscription'},
      ${subscription.id},
      ${subscription.status},
      ${sql.json(subMeta)}
    )
    ON CONFLICT (source, source_id) DO UPDATE SET
      state = EXCLUDED.state,
      meta = EXCLUDED.meta,
      updated_at = now()
  `;

  await insertAudit(
    {
      actor: 'stripe',
      action,
      meta: { subscriptionId: subscription.id, status: subscription.status },
    },
    sql,
  );
}
