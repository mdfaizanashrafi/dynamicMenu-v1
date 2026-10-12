import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

const COUNTED_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "PAID", "COMPLETED"] as const;
const REVENUE_STATUSES = ["PAID", "COMPLETED"] as const;

export interface DailyPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface ItemStat {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CustomerStat {
  id: string;
  name: string;
  phone: string;
  orders: number;
  spent: number;
}

export interface TableStat {
  label: string;
  orders: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface AnalyticsPayload {
  rangeDays: number;
  overview: {
    totalOrders: number;
    revenue: number;
    averageOrderValue: number;
    totalCustomers: number;
    repeatCustomers: number;
    reviewCount: number;
    averageRating: number | null;
  };
  daily: DailyPoint[];
  popularItems: ItemStat[];
  topCustomers: CustomerStat[];
  ordersByTable: TableStat[];
  orderStatusBreakdown: StatusStat[];
  /** Present when more than one restaurant is in scope (organization view). */
  byBranch: { id: string; name: string; orders: number; revenue: number }[];
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toNumber(n: Prisma.Decimal | null | undefined): number {
  return n?.toNumber() ?? 0;
}

/**
 * Restaurant analytics computed live from tenant-scoped order data
 * (PHASES.md §15). Everything is filtered by restaurantId server-side;
 * nothing here can leak across tenants. MANAGER+ only at the route layer.
 */
export async function getAnalytics(
  restaurantIds: string | string[],
  days = 14
): Promise<AnalyticsPayload> {
  const ids = Array.isArray(restaurantIds) ? restaurantIds : [restaurantIds];
  const restaurantId = { in: ids };
  const rangeDays = Math.min(Math.max(days, 1), 90);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (rangeDays - 1));
  since.setUTCHours(0, 0, 0, 0);

  const [
    orderAgg,
    revenueAgg,
    customersAgg,
    repeatAgg,
    reviewAgg,
    dailyOrders,
    dailyRevenue,
    popularItems,
    statusGroups,
    tableOrders,
    topSpenders,
    branchOrderCounts,
    branchRevenue,
  ] = await Promise.all([
    // All-time counted orders
    prisma.order.aggregate({
      where: { restaurantId, status: { in: [...COUNTED_STATUSES] } },
      _count: { _all: true },
    }),
    // All-time revenue (paid/completed only)
    prisma.order.aggregate({
      where: { restaurantId, status: { in: [...REVENUE_STATUSES] } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.customer.count({ where: { restaurantId } }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { restaurantId, customerId: { not: null }, status: { in: [...COUNTED_STATUSES] } },
      _count: { _all: true },
    }),
    prisma.review.aggregate({
      where: { restaurantId },
      _count: { _all: true },
      _avg: { rating: true },
    }),
    // In-range counted orders per day
    prisma.order.groupBy({
      by: ["createdAt"],
      where: {
        restaurantId,
        status: { in: [...COUNTED_STATUSES] },
        createdAt: { gte: since },
      },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["createdAt"],
      where: {
        restaurantId,
        status: { in: [...REVENUE_STATUSES] },
        createdAt: { gte: since },
      },
      _sum: { total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: {
        order: { restaurantId, status: { in: [...COUNTED_STATUSES] }, createdAt: { gte: since } },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { restaurantId, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { restaurantId, status: { in: [...COUNTED_STATUSES] }, createdAt: { gte: since } },
      select: { table: { select: { label: true } } },
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { restaurantId, customerId: { not: null }, status: { in: [...COUNTED_STATUSES] } },
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    // Per-branch breakdown (multi-branch, Phase 15): counted orders + revenue
    prisma.order.groupBy({
      by: ["restaurantId"],
      where: { restaurantId, status: { in: [...COUNTED_STATUSES] } },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["restaurantId"],
      where: { restaurantId, status: { in: [...REVENUE_STATUSES] } },
      _sum: { total: true },
    }),
  ]);

  // Build a zero-filled daily series for the requested range.
  const ordersByDay = new Map<string, number>();
  for (const g of dailyOrders) {
    const key = dayKey(g.createdAt);
    ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + g._count._all);
  }
  const revenueByDay = new Map<string, number>();
  for (const g of dailyRevenue) {
    const key = dayKey(g.createdAt);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + toNumber(g._sum.total));
  }
  const daily: DailyPoint[] = [];
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = dayKey(d);
    daily.push({ date: key, orders: ordersByDay.get(key) ?? 0, revenue: revenueByDay.get(key) ?? 0 });
  }

  // Table + customer labels for display.
  const tableMap = new Map<string, number>();
  for (const o of tableOrders) {
    tableMap.set(o.table.label, (tableMap.get(o.table.label) ?? 0) + 1);
  }
  const ordersByTable: TableStat[] = [...tableMap.entries()]
    .map(([label, orders]) => ({ label, orders }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 8);

  const customerIds = topSpenders.map((c) => c.customerId!).filter(Boolean);
  const customerRows = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, phone: true },
  });
  const customerInfo = new Map(customerRows.map((c) => [c.id, c]));
  const topCustomers: CustomerStat[] = topSpenders
    .map((g) => {
      const info = customerInfo.get(g.customerId!);
      return {
        id: g.customerId!,
        name: info?.name ?? "Unknown",
        phone: info?.phone ?? "",
        orders: g._count._all,
        spent: toNumber(g._sum.total),
      };
    })
    .filter((c) => c.id);

  const revenue = toNumber(revenueAgg._sum.total);
  const revenueOrders = revenueAgg._count._all;

  // Per-branch breakdown, only when the scope spans multiple restaurants.
  let byBranch: AnalyticsPayload["byBranch"] = [];
  if (ids.length > 1) {
    const nameRows = await prisma.restaurant.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const names = new Map(nameRows.map((r) => [r.id, r.name]));
    const orderCount = new Map(branchOrderCounts.map((g) => [g.restaurantId, g._count._all]));
    const revenueMap = new Map(
      branchRevenue.map((g) => [g.restaurantId, toNumber(g._sum.total)])
    );
    byBranch = ids.map((id) => ({
      id,
      name: names.get(id) ?? "Unknown",
      orders: orderCount.get(id) ?? 0,
      revenue: revenueMap.get(id) ?? 0,
    }));
  }

  return {
    rangeDays,
    overview: {
      totalOrders: orderAgg._count._all,
      revenue,
      averageOrderValue: revenueOrders > 0 ? Math.round((revenue / revenueOrders) * 100) / 100 : 0,
      totalCustomers: customersAgg,
      repeatCustomers: repeatAgg.filter((g) => g._count._all > 1).length,
      reviewCount: reviewAgg._count._all,
      averageRating: reviewAgg._avg.rating
        ? Math.round(reviewAgg._avg.rating * 10) / 10
        : null,
    },
    daily,
    popularItems: popularItems.map((i) => ({
      name: i.name,
      quantity: i._sum.quantity ?? 0,
      revenue: toNumber(i._sum.subtotal),
    })),
    topCustomers,
    ordersByTable,
    orderStatusBreakdown: statusGroups.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
    byBranch,
  };
}
