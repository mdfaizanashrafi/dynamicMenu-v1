import type { Plan } from "@prisma/client";

export interface PlanLimits {
  /** null = unlimited */
  tables: number | null;
  menus: number | null;
  offers: number | null;
}

export interface PlanFeatures {
  analytics: boolean;
  loyalty: boolean;
}

export interface PlanDefinition {
  key: Plan;
  name: string;
  /** Display-only price in INR/month; no payment collection exists yet. */
  priceMonthly: number | null;
  tagline: string;
  limits: PlanLimits;
  features: PlanFeatures;
}

/**
 * Static plan catalog (ARCHITECTURE.md §45). Entitlements live here and are
 * checked through billing.service — routes never hard-code plan names.
 * NOTE: prices are informational; the project requirements define no
 * billing provider, so plan changes are self-serve and payment-free.
 */
export const PLANS: PlanDefinition[] = [
  {
    key: "FREE",
    name: "Free",
    priceMonthly: 0,
    tagline: "Try the full ordering flow.",
    limits: { tables: 3, menus: 2, offers: 2 },
    features: { analytics: false, loyalty: false },
  },
  {
    key: "STARTER",
    name: "Starter",
    priceMonthly: 999,
    tagline: "For small cafés getting busy.",
    limits: { tables: 15, menus: 10, offers: 10 },
    features: { analytics: true, loyalty: false },
  },
  {
    key: "PRO",
    name: "Pro",
    priceMonthly: 2499,
    tagline: "Analytics and loyalty included.",
    limits: { tables: 50, menus: 50, offers: 50 },
    features: { analytics: true, loyalty: true },
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    priceMonthly: null,
    tagline: "Unlimited everything — contact us.",
    limits: { tables: null, menus: null, offers: null },
    features: { analytics: true, loyalty: true },
  },
];

export function planByKey(key: Plan): PlanDefinition {
  return PLANS.find((p) => p.key === key) ?? PLANS[0]!;
}

export type LimitResource = keyof PlanLimits;
export type FeatureFlag = keyof PlanFeatures;
