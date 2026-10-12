import type { Plan } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import {
  PLANS,
  planByKey,
  type FeatureFlag,
  type LimitResource,
  type PlanDefinition,
} from "./plans.js";

/**
 * Auto-provision a FREE subscription on first access. For branches, the
 * subscription lives on the root restaurant — the whole organization shares
 * one plan (Phase 15). Usage counts stay per-branch.
 */
export async function getSubscription(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { parentId: true },
  });
  const rootId = restaurant?.parentId ?? restaurantId;
  return prisma.subscription.upsert({
    where: { restaurantId: rootId },
    create: { restaurantId: rootId },
    update: {},
  });
}

export async function getPlan(restaurantId: string): Promise<PlanDefinition> {
  const subscription = await getSubscription(restaurantId);
  return planByKey(subscription.plan);
}

async function usageFor(restaurantId: string, resource: LimitResource): Promise<number> {
  switch (resource) {
    case "tables":
      return prisma.restaurantTable.count({ where: { restaurantId } });
    case "menus":
      return prisma.menu.count({ where: { restaurantId, archivedAt: null } });
    case "offers":
      return prisma.offer.count({ where: { restaurantId } });
  }
}

/** Current usage vs plan limit for one resource (limit null = unlimited). */
export async function getUsage(
  restaurantId: string,
  resource: LimitResource
): Promise<{ used: number; limit: number | null }> {
  const plan = await getPlan(restaurantId);
  return { used: await usageFor(restaurantId, resource), limit: plan.limits[resource] };
}

/**
 * Hard usage limit. Throws 402 PLAN_LIMIT_REACHED when the restaurant's plan
 * is at capacity — checked server-side before any create operation.
 */
export async function assertCanCreate(
  restaurantId: string,
  resource: LimitResource,
  resourceLabel: string
): Promise<void> {
  const plan = await getPlan(restaurantId);
  const limit = plan.limits[resource];
  if (limit === null) return;
  const used = await usageFor(restaurantId, resource);
  if (used >= limit) {
    throw new ApiError(
      402,
      "PLAN_LIMIT_REACHED",
      `Your ${plan.name} plan allows ${limit} ${resourceLabel}. Upgrade to add more.`
    );
  }
}

/**
 * Feature gate (analytics, loyalty, …). Throws 403 PLAN_FEATURE_LOCKED when
 * the current plan does not include the feature.
 */
export async function assertFeature(
  restaurantId: string,
  feature: FeatureFlag,
  featureLabel: string
): Promise<void> {
  const plan = await getPlan(restaurantId);
  if (!plan.features[feature]) {
    throw new ApiError(
      403,
      "PLAN_FEATURE_LOCKED",
      `${featureLabel} is not included in your ${plan.name} plan. Upgrade to unlock it.`
    );
  }
}

/** Silent feature check (e.g. loyalty earning no-ops instead of erroring). */
export async function hasFeature(
  restaurantId: string,
  feature: FeatureFlag
): Promise<boolean> {
  const plan = await getPlan(restaurantId);
  return plan.features[feature];
}

export interface SubscriptionView {
  plan: Plan;
  status: string;
  usage: Record<LimitResource, { used: number; limit: number | null }>;
  plans: (PlanDefinition & { current: boolean })[];
}

export async function getSubscriptionView(restaurantId: string): Promise<SubscriptionView> {
  const subscription = await getSubscription(restaurantId);
  const [tables, menus, offers] = await Promise.all([
    getUsage(restaurantId, "tables"),
    getUsage(restaurantId, "menus"),
    getUsage(restaurantId, "offers"),
  ]);
  return {
    plan: subscription.plan,
    status: subscription.status,
    usage: { tables, menus, offers },
    plans: PLANS.map((p) => ({ ...p, current: p.key === subscription.plan })),
  };
}

/** Self-serve plan change (OWNER). No payment is collected — billing is not defined by the project requirements yet. Applies to the whole organization (root subscription). */
export async function changePlan(restaurantId: string, plan: Plan) {
  const subscription = await getSubscription(restaurantId); // resolves root
  return prisma.subscription.update({
    where: { id: subscription.id },
    data: { plan, status: "ACTIVE" },
  });
}
