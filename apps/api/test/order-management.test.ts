import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/app.js";
import { authHeader, createStubVerifier } from "./helpers.js";

const app = createApp(createStubVerifier());

async function seedOwner() {
  const user = await prisma.user.create({
    data: { clerkId: "clerk_owner", email: "owner@test.com" },
  });
  const restaurant = await prisma.restaurant.create({
    data: { name: "Mgmt House", slug: "mgmt-house" },
  });
  await prisma.restaurantMembership.create({
    data: { userId: user.id, restaurantId: restaurant.id, role: "OWNER" },
  });
  return { user, restaurant };
}

const asOwner = () => authHeader("clerk_owner");

async function createTable(restaurantId: string, label = "Table 1") {
  return prisma.restaurantTable.create({
    data: { restaurantId, label, qrToken: crypto.randomUUID().replace(/-/g, "").slice(0, 24) },
  });
}

async function createOrder(restaurantId: string, tableId: string, status = "PENDING") {
  return prisma.order.create({
    data: {
      restaurantId,
      tableId,
      status: status as never,
      customerName: "Guest",
      customerPhone: "555-0100",
      subtotal: new Prisma.Decimal(100),
      total: new Prisma.Decimal(100),
      items: {
        create: [
          {
            menuItemId: "item-1",
            name: "Dish",
            quantity: 1,
            basePrice: new Prisma.Decimal(100),
            subtotal: new Prisma.Decimal(100),
          },
        ],
      },
    },
  });
}

describe("restaurant order management (integration)", () => {
  let restaurantId = "";
  let tableId = "";

  beforeEach(async () => {
    await prisma.orderItemAddon.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.restaurantTable.deleteMany();
    await prisma.restaurantTheme.deleteMany();
    await prisma.menuItemAddon.deleteMany();
    await prisma.menuItemVariant.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.menuSection.deleteMany();
    await prisma.menuRevision.deleteMany();
    await prisma.menu.deleteMany();
    await prisma.restaurantMembership.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
    ({ restaurant: { id: restaurantId } } = await seedOwner());
    const table = await createTable(restaurantId);
    tableId = table.id;
  });

  const ordersUrl = (path = "") => `/api/v1/restaurants/${restaurantId}/orders${path}`;

  it("walks the full order lifecycle", async () => {
    const order = await createOrder(restaurantId, tableId);
    const chain = ["CONFIRMED", "PREPARING", "READY", "SERVED", "PAID", "COMPLETED"] as const;

    const currentId = order.id;
    for (const status of chain) {
      const res = await request(app)
        .patch(ordersUrl(`/${currentId}`))
        .set(asOwner())
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(status);
    }
  });

  it("rejects invalid transitions and terminal states", async () => {
    const order = await createOrder(restaurantId, tableId);

    const jump = await request(app)
      .patch(ordersUrl(`/${order.id}`))
      .set(asOwner())
      .send({ status: "PAID" });
    expect(jump.status).toBe(400);
    expect(jump.body.error.code).toBe("ORDER_INVALID_TRANSITION");

    const confirmed = await request(app)
      .patch(ordersUrl(`/${order.id}`))
      .set(asOwner())
      .send({ status: "CONFIRMED" });
    expect(confirmed.status).toBe(200);

    const back = await request(app)
      .patch(ordersUrl(`/${order.id}`))
      .set(asOwner())
      .send({ status: "PENDING" });
    expect(back.status).toBe(400);

    const rejectAfterConfirm = await request(app)
      .patch(ordersUrl(`/${order.id}`))
      .set(asOwner())
      .send({ status: "REJECTED" });
    expect(rejectAfterConfirm.status).toBe(400);

    const cancelled = await request(app)
      .patch(ordersUrl(`/${order.id}`))
      .set(asOwner())
      .send({ status: "CANCELLED" });
    expect(cancelled.status).toBe(200);

    const fromCancelled = await request(app)
      .patch(ordersUrl(`/${order.id}`))
      .set(asOwner())
      .send({ status: "CONFIRMED" });
    expect(fromCancelled.status).toBe(400);
  });

  it("allows rejecting a pending order", async () => {
    const order = await createOrder(restaurantId, tableId);
    const res = await request(app)
      .patch(ordersUrl(`/${order.id}`))
      .set(asOwner())
      .send({ status: "REJECTED" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("REJECTED");
  });

  it("lists orders with optional status filter and item details", async () => {
    await createOrder(restaurantId, tableId, "PENDING");
    await createOrder(restaurantId, tableId, "PAID");
    await createOrder(restaurantId, tableId, "PAID");

    const all = await request(app).get(ordersUrl()).set(asOwner());
    expect(all.status).toBe(200);
    expect(all.body.data).toHaveLength(3);

    const paid = await request(app)
      .get(ordersUrl("?status=PAID"))
      .set(asOwner());
    expect(paid.status).toBe(200);
    expect(paid.body.data).toHaveLength(2);
    expect(paid.body.data[0].items[0].name).toBe("Dish");
    expect(paid.body.data[0].table.label).toBe("Table 1");

    const detail = await request(app)
      .get(ordersUrl(`/${paid.body.data[0].id}`))
      .set(asOwner());
    expect(detail.status).toBe(200);
    expect(detail.body.data.status).toBe("PAID");
  });

  it("keeps orders tenant-scoped", async () => {
    const order = await createOrder(restaurantId, tableId);
    const other = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-mgmt" },
    });
    const otherTable = await createTable(other.id, "T9");

    const crossGet = await request(app)
      .get(`/api/v1/restaurants/${other.id}/orders/${order.id}`)
      .set(authHeader("clerk_owner"));
    // Owner is not a member of "other" — requireMembership returns 404.
    expect(crossGet.status).toBe(404);

    const otherOrder = await createOrder(other.id, otherTable.id);
    const crossPatch = await request(app)
      .patch(ordersUrl(`/${otherOrder.id}`))
      .set(asOwner())
      .send({ status: "CONFIRMED" });
    expect(crossPatch.status).toBe(404);

    const intact = await prisma.order.findUnique({ where: { id: otherOrder.id } });
    expect(intact?.status).toBe("PENDING");
  });

  it("allows STAFF to manage orders and rejects outsiders", async () => {
    const staff = await prisma.user.create({
      data: { clerkId: "clerk_staff", email: "staff@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: staff.id, restaurantId, role: "STAFF" },
    });

    const order = await createOrder(restaurantId, tableId);
    const res = await request(app)
      .patch(ordersUrl(`/${order.id}`))
      .set(authHeader("clerk_staff"))
      .send({ status: "CONFIRMED" });
    expect(res.status).toBe(200);

    await prisma.user.create({
      data: { clerkId: "clerk_out", email: "out@test.com" },
    });
    const outsider = await request(app)
      .get(ordersUrl())
      .set(authHeader("clerk_out"));
    expect(outsider.status).toBe(404);

    const anon = await request(app).get(ordersUrl());
    expect(anon.status).toBe(401);
  });

  it("validates the status payload", async () => {
    const order = await createOrder(restaurantId, tableId);
    const bad = await request(app)
      .patch(ordersUrl(`/${order.id}`))
      .set(asOwner())
      .send({ status: "NOT_A_STATUS" });
    expect(bad.status).toBe(400);
  });
});
