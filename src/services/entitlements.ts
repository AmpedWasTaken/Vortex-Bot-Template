import type { ChatInputCommandInteraction, Entitlement } from 'discord.js';
import type { AppConfig } from '../config/index.js';

export interface EntitlementLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
}

/** Normalized entitlement for logs, webhooks, and cache lookups. */
export interface NormalizedEntitlement {
  id: string;
  skuId: string;
  userId: string;
  guildId: string | null;
  type: number;
  deleted: boolean;
  consumed: boolean;
  isActive: boolean;
}

export function normalizeEntitlement(entitlement: Entitlement): NormalizedEntitlement {
  return {
    id: entitlement.id,
    skuId: entitlement.skuId,
    userId: entitlement.userId,
    guildId: entitlement.guildId,
    type: entitlement.type,
    deleted: entitlement.deleted,
    consumed: entitlement.consumed,
    isActive: entitlement.isActive(),
  };
}

/**
 * Tracks Discord Application Entitlements from gateway events and exposes helpers
 * for premium slash command gating via `interaction.entitlements`.
 */
export class EntitlementService {
  private readonly byId = new Map<string, NormalizedEntitlement>();

  constructor(
    private readonly config: AppConfig,
    private readonly logger: EntitlementLogger,
  ) {}

  /** Upsert from `entitlementCreate` / `entitlementUpdate`. */
  upsert(entitlement: Entitlement): void {
    const normalized = normalizeEntitlement(entitlement);
    this.byId.set(normalized.id, normalized);
    this.logger.info('Entitlement upserted', {
      entitlementId: normalized.id,
      skuId: normalized.skuId,
      userId: normalized.userId,
      guildId: normalized.guildId,
      type: normalized.type,
      isActive: normalized.isActive,
      deleted: normalized.deleted,
    });
  }

  /** Remove from cache on `entitlementDelete` or soft-delete. */
  remove(entitlement: Entitlement): void {
    this.byId.delete(entitlement.id);
    this.logger.info('Entitlement removed from cache', {
      entitlementId: entitlement.id,
      skuId: entitlement.skuId,
      userId: entitlement.userId,
      guildId: entitlement.guildId,
    });
  }

  snapshot(): NormalizedEntitlement[] {
    return [...this.byId.values()];
  }

  size(): number {
    return this.byId.size;
  }

  /**
   * Active SKU IDs Discord attaches to this interaction (preferred for gating).
   * @see https://discord.com/developers/docs/monetization/entitlements
   */
  interactionActiveSkuIds(interaction: ChatInputCommandInteraction): Set<string> {
    const ids = new Set<string>();
    for (const entitlement of interaction.entitlements.values()) {
      if (entitlement.deleted) continue;
      if (!entitlement.isActive()) continue;
      ids.add(entitlement.skuId);
    }
    return ids;
  }

  /**
   * True if the interaction includes an active entitlement for any of `skuIds`,
   * or dev bypass is enabled (non-production only).
   */
  interactionHasAnySku(interaction: ChatInputCommandInteraction, skuIds: readonly string[]): boolean {
    if (skuIds.length === 0) return false;
    if (this.config.monetization.devEntitlementBypass && !this.config.isProduction) {
      this.logger.debug('Dev entitlement bypass enabled; treating as entitled');
      return true;
    }
    const active = this.interactionActiveSkuIds(interaction);
    return skuIds.some((sku) => active.has(sku));
  }

  /** Convenience: match configured `PREMIUM_SKU_IDS`. */
  interactionHasPremiumSku(interaction: ChatInputCommandInteraction): boolean {
    return this.interactionHasAnySku(interaction, this.config.monetization.premiumSkuIds);
  }
}

export function createEntitlementService(config: AppConfig, logger: EntitlementLogger): EntitlementService {
  return new EntitlementService(config, logger);
}
