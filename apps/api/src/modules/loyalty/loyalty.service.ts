import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { hasFeature } from "../billing/billing.service.js";

/** Earning rule: 1 point per 100 spent on a paid order, floored. */
export const LOYALTY_POINT_VALUE = 100;

export function pointsForTotal(total: number): number {
  return Math.floor(total / LOYALTY_POINT_VALUE);
}

export interface LoyaltyAccountDto {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  points: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  updatedAt: string;
}

export interface LoyaltyTransactionDto {
  id: string;
  type: string;
  points: number;
  reason: string | null;
  orderId: string | null;
  createdAt: string;
}

function toDto(account: {
  id: string;
  customerId: string;
  points: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  updatedAt: Date;
  customer: { name: string; phone: string };
}): LoyaltyAccountDto {
  return {
    id: account.id,
    customerId: account.customerId,
    name: account.customer.name,
    phone: account.customer.phone,
    points: account.points,
    lifetimeEarned: account.lifetimeEarned,
    lifetimeRedeemed: account.lifetimeRedeemed,
    updatedAt: account.updatedAt.toISOString(),
  };
}

/**
 * Award points for a freshly PAID order (Loyalty Program earning rule).
 * Idempotent: a second call for the same order is a no-op, so retries and
 * the PAID→COMPLETED transition can never double-award.
 */
export async function awardPointsForOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, restaurantId: true, customerId: true, total: true },
  });
  if (!order?.customerId) return;

  // Feature gate: plans without loyalty simply don't earn points.
  if (!(await hasFeature(order.restaurantId, "loyalty"))) return;

  const existing = await prisma.loyaltyTransaction.findFirst({
    where: { orderId: order.id, type: "EARN" },
    select: { id: true },
  });
  if (existing) return;

  const points = pointsForTotal(order.total.toNumber());
  if (points <= 0) return;

  await prisma.$transaction(async (tx) => {
    const account = await tx.loyaltyAccount.upsert({
      where: { customerId: order.customerId! },
      create: {
        restaurantId: order.restaurantId,
        customerId: order.customerId!,
        points,
        lifetimeEarned: points,
      },
      update: { points: { increment: points }, lifetimeEarned: { increment: points } },
    });

    await tx.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        type: "EARN",
        points,
        reason: `Order ${order.id.slice(-6).toUpperCase()} marked paid`,
        orderId: order.id,
      },
    });
  });
}

export async function listAccounts(
  restaurantId: string,
  q?: string
): Promise<LoyaltyAccountDto[]> {
  const accounts = await prisma.loyaltyAccount.findMany({
    where: {
      restaurantId,
      ...(q
        ? {
            customer: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { points: "desc" },
    take: 200,
  });
  return accounts.map(toDto);
}

/** Redeem points at the counter. Balance is validated atomically server-side. */
export async function redeemPoints(
  restaurantId: string,
  input: { customerId?: string; phone?: string; points: number; reason?: string }
): Promise<LoyaltyAccountDto> {
  const customer = input.customerId
    ? await prisma.customer.findFirst({ where: { id: input.customerId, restaurantId } })
    : input.phone
      ? await prisma.customer.findFirst({ where: { restaurantId, phone: input.phone } })
      : null;
  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "No customer found for this restaurant.");
  }
  if (input.points <= 0) {
    throw new ApiError(400, "LOYALTY_INVALID_POINTS", "Points to redeem must be positive.");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.loyaltyAccount.upsert({
        where: { customerId: customer.id },
        create: {
          restaurantId,
          customerId: customer.id,
          points: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
        },
        update: {},
      });

      if (account.points < input.points) {
        throw new ApiError(
          400,
          "LOYALTY_INSUFFICIENT_POINTS",
          `This customer has ${account.points} points; ${input.points} requested.`
        );
      }

      const updated = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { decrement: input.points },
          lifetimeRedeemed: { increment: input.points },
        },
        include: { customer: { select: { name: true, phone: true } } },
      });

      await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: "REDEEM",
          points: input.points,
          reason: input.reason ?? null,
        },
      });

      return updated;
    });
    return toDto(result);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw error;
  }
}

export async function getAccountForCustomer(
  customerId: string
): Promise<{ points: number; lifetimeEarned: number; lifetimeRedeemed: number } | null> {
  const account = await prisma.loyaltyAccount.findUnique({ where: { customerId } });
  return account
    ? {
        points: account.points,
        lifetimeEarned: account.lifetimeEarned,
        lifetimeRedeemed: account.lifetimeRedeemed,
      }
    : null;
}

export async function getTransactionsForCustomer(
  customerId: string
): Promise<LoyaltyTransactionDto[]> {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { customerId },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  return (account?.transactions ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    points: t.points,
    reason: t.reason,
    orderId: t.orderId,
    createdAt: t.createdAt.toISOString(),
  }));
}
