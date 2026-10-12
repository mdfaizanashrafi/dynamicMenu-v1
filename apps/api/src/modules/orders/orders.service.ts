import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { awardPointsForOrder } from "../loyalty/loyalty.service.js";
import { bestActiveDiscount } from "../offers/offers.service.js";
import { resolveCustomerMenu } from "../public/public.service.js";
import type { MenuSnapshot, MenuSnapshotItem } from "../menus/menus.service.js";
import type { CreateOrderInput } from "./orders.schemas.js";

export interface OrderItemAddonDto {
  id: string;
  addonId: string;
  name: string;
  price: number;
}

export interface OrderItemDto {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  variantId: string | null;
  variantName: string | null;
  variantPrice: number | null;
  subtotal: number;
  addons: OrderItemAddonDto[];
}

export interface OrderDto {
  id: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  total: number;
  offerId: string | null;
  items: OrderItemDto[];
  createdAt: string;
}

interface PricedItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  variantId?: string;
  variantName?: string;
  variantPrice: number;
  addons: { addonId: string; name: string; price: number }[];
  quantity: number;
  subtotal: number;
}

/**
 * Build lookup maps from the published menu snapshot so the cart can be
 * validated and priced entirely server-side (frontend prices are ignored).
 */
function buildSnapshotMaps(snapshot: MenuSnapshot) {
  const items = new Map<string, MenuSnapshotItem>();
  const variants = new Map<string, { itemId: string; name: string; price: number }>();
  const addons = new Map<string, { itemId: string; name: string; price: number }>();

  for (const section of snapshot.sections) {
    for (const item of section.items) {
      items.set(item.id, item);
      for (const v of item.variants) {
        variants.set(v.id, { itemId: item.id, name: v.name, price: v.price });
      }
      for (const a of item.addons) {
        addons.set(a.id, { itemId: item.id, name: a.name, price: a.price });
      }
    }
  }

  return { items, variants, addons };
}

function toNumber(n: Prisma.Decimal): number {
  return n.toNumber();
}

/**
 * Create an order from a customer cart. The token determines restaurant + table.
 * All prices and totals are recomputed from the published menu snapshot;
 * any price/total sent by the frontend is ignored (PHASES.md §11).
 */
export async function createOrder(token: string, input: CreateOrderInput): Promise<OrderDto> {
  const resolved = await resolveCustomerMenu(token);
  if (!resolved.menu) {
    throw new ApiError(
      400,
      "ORDER_MENU_UNAVAILABLE",
      "This restaurant does not have a published menu right now."
    );
  }

  const snapshot = resolved.menu;
  const { items: itemMap, variants: variantMap, addons: addonMap } = buildSnapshotMaps(snapshot);

  const table = await prisma.restaurantTable.findFirst({
    where: { qrToken: token, isActive: true },
    select: { id: true, restaurantId: true },
  });
  if (!table) {
    throw new ApiError(
      404,
      "INVALID_QR",
      "This QR code is unavailable. Please ask restaurant staff for a new QR code."
    );
  }

  // Live availability is authoritative (a manager can flip it without
  // republishing), while pricing comes from the published snapshot.
  const liveItems = await prisma.menuItem.findMany({
    where: {
      id: { in: input.items.map((i) => i.menuItemId) },
      section: { menu: { restaurantId: table.restaurantId } },
    },
    include: { variants: true, addons: true },
  });
  const liveItemMap = new Map(liveItems.map((i) => [i.id, i]));

  const pricedItems: PricedItem[] = [];

  for (const line of input.items) {
    const item = itemMap.get(line.menuItemId);
    const liveItem = liveItemMap.get(line.menuItemId);
    if (!item || !liveItem || !liveItem.isAvailable) {
      throw new ApiError(
        400,
        "ORDER_INVALID_ITEM",
        `An item in your cart is no longer available (${line.menuItemId}).`
      );
    }

    let variantName: string | undefined;
    let variantPrice = 0;
    if (line.variantId) {
      const variant = variantMap.get(line.variantId);
      const liveVariant = liveItem.variants.find((v) => v.id === line.variantId);
      if (!variant || variant.itemId !== item.id || !liveVariant) {
        throw new ApiError(
          400,
          "ORDER_INVALID_VARIANT",
          `A selected variant is not available for ${item.name}.`
        );
      }
      if (!liveVariant.isAvailable) {
        throw new ApiError(400, "ORDER_INVALID_VARIANT", `${variant.name} is unavailable.`);
      }
      variantName = variant.name;
      variantPrice = variant.price;
    }

    const selectedAddons: PricedItem["addons"] = [];
    for (const addonId of line.addonIds) {
      const addon = addonMap.get(addonId);
      const liveAddon = liveItem.addons.find((a) => a.id === addonId);
      if (!addon || addon.itemId !== item.id || !liveAddon) {
        throw new ApiError(
          400,
          "ORDER_INVALID_ADDON",
          `A selected add-on is not available for ${item.name}.`
        );
      }
      if (!liveAddon.isAvailable) {
        throw new ApiError(400, "ORDER_INVALID_ADDON", `${addon.name} is unavailable.`);
      }
      selectedAddons.push({ addonId, name: addon.name, price: addon.price });
    }

    const unitPrice = item.price + variantPrice + selectedAddons.reduce((s, a) => s + a.price, 0);
    pricedItems.push({
      menuItemId: item.id,
      name: item.name,
      basePrice: item.price,
      variantId: line.variantId,
      variantName,
      variantPrice,
      addons: selectedAddons,
      quantity: line.quantity,
      subtotal: unitPrice * line.quantity,
    });
  }

  const subtotal = pricedItems.reduce((sum, p) => sum + p.subtotal, 0);

  // Promotional campaigns: the best scheduled, discount-bearing offer is
  // applied automatically. The discount is computed here, never by the client.
  const best = await bestActiveDiscount(table.restaurantId, subtotal);
  const discount = best?.discount ?? 0;
  const total = subtotal - discount;

  const order = await prisma.$transaction(async (tx) => {
    // Customers are restaurant-scoped and identified by phone (Phase 10).
    const customer = await tx.customer.upsert({
      where: {
        restaurantId_phone: {
          restaurantId: table.restaurantId,
          phone: input.customerPhone,
        },
      },
      create: {
        restaurantId: table.restaurantId,
        name: input.customerName,
        phone: input.customerPhone,
        email: input.customerEmail ?? null,
      },
      update: {
        name: input.customerName,
        ...(input.customerEmail ? { email: input.customerEmail } : {}),
      },
    });

    const created = await tx.order.create({
      data: {
        restaurantId: table.restaurantId,
        tableId: table.id,
        customerId: customer.id,
        status: "PENDING",
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail ?? null,
        notes: input.notes ?? null,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        total: new Prisma.Decimal(total),
        offerId: best?.offerId ?? null,
      },
    });

    for (const p of pricedItems) {
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: created.id,
          menuItemId: p.menuItemId,
          name: p.name,
          quantity: p.quantity,
          basePrice: new Prisma.Decimal(p.basePrice),
          variantId: p.variantId,
          variantName: p.variantName ?? null,
          variantPrice: p.variantPrice ? new Prisma.Decimal(p.variantPrice) : null,
          subtotal: new Prisma.Decimal(p.subtotal),
        },
      });

      if (p.addons.length > 0) {
        await tx.orderItemAddon.createMany({
          data: p.addons.map((a) => ({
            orderItemId: orderItem.id,
            addonId: a.addonId,
            name: a.name,
            price: new Prisma.Decimal(a.price),
          })),
        });
      }
    }

    return created;
  });

  // Reload with items/addons for the response.
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: {
        include: { addons: true },
      },
    },
  });

  if (!fullOrder) {
    throw new ApiError(500, "ORDER_CREATE_FAILED", "Could not retrieve the created order.");
  }

  return {
    id: fullOrder.id,
    status: fullOrder.status,
    customerName: fullOrder.customerName ?? "",
    customerPhone: fullOrder.customerPhone ?? "",
    customerEmail: fullOrder.customerEmail,
    notes: fullOrder.notes,
    subtotal: toNumber(fullOrder.subtotal),
    discount: toNumber(fullOrder.discount),
    total: toNumber(fullOrder.total),
    offerId: fullOrder.offerId,
    createdAt: fullOrder.createdAt.toISOString(),
    items: fullOrder.items.map((i) => ({
      id: i.id,
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      basePrice: toNumber(i.basePrice),
      variantId: i.variantId,
      variantName: i.variantName,
      variantPrice: i.variantPrice ? toNumber(i.variantPrice) : null,
      subtotal: toNumber(i.subtotal),
      addons: i.addons.map((a) => ({
        id: a.id,
        addonId: a.addonId,
        name: a.name,
        price: toNumber(a.price),
      })),
    })),
  };
}

// ── Restaurant order management (PHASES.md §12, ARCHITECTURE.md §15) ──────

export interface DashboardOrderDto extends OrderDto {
  updatedAt: string;
  table: { id: string; label: string };
}

const includeForDashboard = {
  table: { select: { id: true, label: true } },
  items: { include: { addons: true } },
} satisfies Prisma.OrderInclude;

function toDashboardDto(
  order: Prisma.OrderGetPayload<{ include: typeof includeForDashboard }>
): DashboardOrderDto {
  return {
    id: order.id,
    status: order.status,
    customerName: order.customerName ?? "",
    customerPhone: order.customerPhone ?? "",
    customerEmail: order.customerEmail,
    notes: order.notes,
    subtotal: toNumber(order.subtotal),
    discount: toNumber(order.discount),
    total: toNumber(order.total),
    offerId: order.offerId,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    table: order.table,
    items: order.items.map((i) => ({
      id: i.id,
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      basePrice: toNumber(i.basePrice),
      variantId: i.variantId,
      variantName: i.variantName,
      variantPrice: i.variantPrice ? toNumber(i.variantPrice) : null,
      subtotal: toNumber(i.subtotal),
      addons: i.addons.map((a) => ({
        id: a.id,
        addonId: a.addonId,
        name: a.name,
        price: toNumber(a.price),
      })),
    })),
  };
}

export async function listRestaurantOrders(restaurantId: string, status?: OrderStatus) {
  const orders = await prisma.order.findMany({
    where: { restaurantId, ...(status ? { status } : {}) },
    include: includeForDashboard,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return orders.map(toDashboardDto);
}

export async function getRestaurantOrder(restaurantId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: includeForDashboard,
  });
  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "The requested order could not be found.");
  }
  return toDashboardDto(order);
}

/**
 * Valid order lifecycle (ARCHITECTURE.md §15). CANCELLED/REJECTED are
 * terminal; REJECTED is only allowed while the order is still PENDING.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED"],
  SERVED: ["PAID"],
  PAID: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

export async function transitionOrder(
  restaurantId: string,
  orderId: string,
  target: OrderStatus
): Promise<DashboardOrderDto> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: includeForDashboard,
  });
  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "The requested order could not be found.");
  }

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(target)) {
    throw new ApiError(
      400,
      "ORDER_INVALID_TRANSITION",
      `Cannot move an order from ${order.status} to ${target}.`
    );
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: target },
    include: includeForDashboard,
  });

  // Loyalty Program: points are earned exactly once when an order is PAID.
  if (target === "PAID") {
    await awardPointsForOrder(order.id);
  }

  return toDashboardDto(updated);
}
