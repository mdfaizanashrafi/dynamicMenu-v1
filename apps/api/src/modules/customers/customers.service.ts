import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { roleAtLeast } from "../../utils/roles.js";
import {
  getAccountForCustomer,
  getTransactionsForCustomer,
} from "../loyalty/loyalty.service.js";
import type { Role } from "@prisma/client";

export interface CustomerSummaryDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface CustomerOrderLineDto {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

export interface CustomerDetailDto extends CustomerSummaryDto {
  firstOrderAt: string | null;
  averageOrderValue: number;
  favoriteItem: string | null;
  recentOrders: CustomerOrderLineDto[];
  loyalty: {
    points: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    transactions: import("../loyalty/loyalty.service.js").LoyaltyTransactionDto[];
  } | null;
}

async function aggregatesFor(customerIds: string[]) {
  if (customerIds.length === 0) {
    return new Map<string, { count: number; spent: number; last: Date | null; first: Date | null }>();
  }
  const grouped = await prisma.order.groupBy({
    by: ["customerId"],
    where: { customerId: { in: customerIds } },
    _count: { _all: true },
    _sum: { total: true },
    _max: { createdAt: true },
    _min: { createdAt: true },
  });
  return new Map(
    grouped.map((g) => [
      g.customerId!,
      {
        count: g._count._all,
        spent: g._sum.total?.toNumber() ?? 0,
        last: g._max.createdAt,
        first: g._min.createdAt,
      },
    ])
  );
}

/** List customers with order aggregates; search matches name/phone/email. */
export async function listCustomers(
  restaurantId: string,
  role: Role,
  q?: string
): Promise<CustomerSummaryDto[]> {
  const customers = await prisma.customer.findMany({
    where: {
      restaurantId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const agg = await aggregatesFor(customers.map((c) => c.id));
  const canSeeEmail = roleAtLeast(role, "MANAGER");

  return customers.map((c) => {
    const a = agg.get(c.id);
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: canSeeEmail ? c.email : null,
      orderCount: a?.count ?? 0,
      totalSpent: a?.spent ?? 0,
      lastOrderAt: a?.last?.toISOString() ?? null,
    };
  });
}

/** Customer profile + order history + basic insights (MANAGER+ only). */
export async function getCustomerDetail(
  restaurantId: string,
  customerId: string
): Promise<CustomerDetailDto> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, restaurantId },
  });
  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "The requested customer could not be found.");
  }

  const [agg, orders, favorite, loyalty, loyaltyHistory] = await Promise.all([
    aggregatesFor([customer.id]),
    prisma.order.findMany({
      where: { customerId: customer.id },
      include: { items: { select: { name: true, quantity: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { customerId: customer.id } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 1,
    }),
    getAccountForCustomer(customer.id),
    getTransactionsForCustomer(customer.id),
  ]);

  const a = agg.get(customer.id);
  const orderCount = a?.count ?? 0;
  const totalSpent = a?.spent ?? 0;

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    orderCount,
    totalSpent,
    lastOrderAt: a?.last?.toISOString() ?? null,
    firstOrderAt: a?.first?.toISOString() ?? null,
    averageOrderValue: orderCount > 0 ? Math.round((totalSpent / orderCount) * 100) / 100 : 0,
    favoriteItem: favorite[0]?.name ?? null,
    recentOrders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total.toNumber(),
      createdAt: o.createdAt.toISOString(),
      items: o.items,
    })),
    loyalty: loyalty
      ? { ...loyalty, transactions: loyaltyHistory }
      : null,
  };
}
