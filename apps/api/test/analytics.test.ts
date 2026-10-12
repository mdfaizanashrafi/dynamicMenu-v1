import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/app.js";
import { authHeader, createStubVerifier } from "./helpers.js";

const app = createApp(createStubVerifier());

async function seedOwner() {
  const user = await prisma.user.create({
    data: { clerkId: "clerk_owner", email: "owner@test.com" },
  });
  const restaurant = await prisma.restaurant.create({
    data: { name: "Analytics House", slug: "analytics-house" },
  });
  await prisma.restaurantMembership.create({
    data: { userId: user.id, restaurantId: restaurant.id, role: "OWNER" },
  });
  return { user, restaurant };
}

const asOwner = () => authHeader("clerk_owner");

async function createPublishedMenu(restaurantId: string) {
  const menuRes = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus`)
    .set(asOwner())
    .send({ name: "Dinner" });
  const menuId = menuRes.body.data.id as string;
  const sectionRes = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections`)
    .set(asOwner())
    .send({ name: "Mains" });
  const sectionId = sectionRes.body.data.id as string;

  const ids: Record<string, string> = {};
  for (const [name, price] of [["Burger", 100], ["Fries", 50]] as const) {
    const res = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections/${sectionId}/items`)
      .set(asOwner())
      .send({ name, price });
    ids[name] = res.body.data.id;
  }
  await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus/${menuId}/publish`)
    .set(asOwner());
  return ids as { Burger: string; Fries: string };
}

async function createTable(restaurantId: string, label: string) {
  const res = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/tables`)
    .set(asOwner())
    .send({ label });
  return res.body.data.qrToken as string;
}

async function placeOrder(
  token: string,
  customer: { name: string; phone: string },
  items: { menuItemId: string; quantity: number }[]
) {
  const res = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
    customerName: customer.name,
    customerPhone: customer.phone,
    items,
  });
  expect(res.status).toBe(201);
  return res.body.data as { id: string };
}

describe("analytics (integration)", () => {
  let restaurantId = "";
  let items: { Burger: string; Fries: string } = { Burger: "", Fries: "" };
  let tableA = "";
  let tableB = "";

  beforeEach(async () => {
    await prisma.review.deleteMany();
    await prisma.orderItemAddon.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();
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
    // Analytics is a paid feature (Phase 14 entitlements).
    await prisma.subscription.create({
      data: { restaurantId, plan: "PRO" },
    });
    items = await createPublishedMenu(restaurantId);
    tableA = await createTable(restaurantId, "Table 1");
    tableB = await createTable(restaurantId, "Table 2");
  });

  const analyticsUrl = (query = "") =>
    `/api/v1/restaurants/${restaurantId}/analytics${query}`;

  it("computes overview, trends, popular items, customers, tables, and statuses", async () => {
    const alice = { name: "Alice", phone: "111" };
    const bob = { name: "Bob", phone: "222" };

    const o1 = await placeOrder(tableA, alice, [
      { menuItemId: items.Burger, quantity: 2 },
      { menuItemId: items.Fries, quantity: 1 },
    ]); // 250, PENDING
    const o2 = await placeOrder(tableA, alice, [
      { menuItemId: items.Burger, quantity: 1 },
    ]); // 100, will be PAID
    await placeOrder(tableB, bob, [
      { menuItemId: items.Fries, quantity: 3 },
    ]); // 150, will be CANCELLED

    await prisma.order.update({ where: { id: o2.id }, data: { status: "PAID" } });
    const cancelled = await prisma.order.findFirst({
      where: { restaurantId, customerPhone: "222" },
    });
    await prisma.order.update({ where: { id: cancelled!.id }, data: { status: "CANCELLED" } });
    void o1;

    const res = await request(app).get(analyticsUrl("?days=14")).set(asOwner());
    expect(res.status).toBe(200);
    const data = res.body.data;

    expect(data.overview).toMatchObject({
      totalOrders: 2, // cancelled excluded
      revenue: 100, // paid only
      averageOrderValue: 100,
      totalCustomers: 2,
      repeatCustomers: 1,
      reviewCount: 0,
      averageRating: null,
    });

    expect(data.daily).toHaveLength(14);
    const today = data.daily[13];
    expect(today.orders).toBe(2);
    expect(today.revenue).toBe(100);

    expect(data.popularItems[0]).toMatchObject({ name: "Burger", quantity: 3, revenue: 300 });
    expect(data.popularItems[1]).toMatchObject({ name: "Fries", quantity: 1, revenue: 50 });

    expect(data.topCustomers[0]).toMatchObject({ name: "Alice", orders: 2, spent: 350 });

    const tableStats = Object.fromEntries(
      data.ordersByTable.map((t: { label: string; orders: number }) => [t.label, t.orders])
    );
    expect(tableStats["Table 1"]).toBe(2);
    expect(tableStats["Table 2"]).toBeUndefined(); // cancelled orders excluded

    const statuses = Object.fromEntries(
      data.orderStatusBreakdown.map((s: { status: string; count: number }) => [s.status, s.count])
    );
    expect(statuses.PENDING).toBe(1);
    expect(statuses.PAID).toBe(1);
    expect(statuses.CANCELLED).toBe(1);
  });

  it("includes review aggregates in the overview", async () => {
    const order = await placeOrder(tableA, { name: "Alice", phone: "111" }, [
      { menuItemId: items.Burger, quantity: 1 },
    ]);
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
    await prisma.review.create({
      data: { orderId: order.id, restaurantId, rating: 4, comment: "Good" },
    });

    const res = await request(app).get(analyticsUrl()).set(asOwner());
    expect(res.body.data.overview.reviewCount).toBe(1);
    expect(res.body.data.overview.averageRating).toBe(4);
  });

  it("requires MANAGER+ and rejects outsiders", async () => {
    await placeOrder(tableA, { name: "Alice", phone: "111" }, [
      { menuItemId: items.Burger, quantity: 1 },
    ]);

    const staff = await prisma.user.create({
      data: { clerkId: "clerk_staff", email: "staff@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: staff.id, restaurantId, role: "STAFF" },
    });
    const staffRes = await request(app).get(analyticsUrl()).set(authHeader("clerk_staff"));
    expect(staffRes.status).toBe(403);

    await prisma.user.create({ data: { clerkId: "clerk_out", email: "out@test.com" } });
    const outsider = await request(app).get(analyticsUrl()).set(authHeader("clerk_out"));
    expect(outsider.status).toBe(404);

    const anon = await request(app).get(analyticsUrl());
    expect(anon.status).toBe(401);
  });

  it("keeps analytics tenant-isolated", async () => {
    await placeOrder(tableA, { name: "Alice", phone: "111" }, [
      { menuItemId: items.Burger, quantity: 1 },
    ]);

    const other = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-analytics" },
    });
    await prisma.subscription.create({
      data: { restaurantId: other.id, plan: "PRO" },
    });
    const otherOwner = await prisma.user.create({
      data: { clerkId: "clerk_other", email: "other@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: otherOwner.id, restaurantId: other.id, role: "OWNER" },
    });

    const res = await request(app)
      .get(`/api/v1/restaurants/${other.id}/analytics`)
      .set(authHeader("clerk_other"));
    expect(res.status).toBe(200);
    expect(res.body.data.overview.totalOrders).toBe(0);
    expect(res.body.data.overview.totalCustomers).toBe(0);
  });

  it("validates the days parameter", async () => {
    const bad = await request(app).get(analyticsUrl("?days=0")).set(asOwner());
    expect(bad.status).toBe(400);
    const big = await request(app).get(analyticsUrl("?days=91")).set(asOwner());
    expect(big.status).toBe(400);
  });
});
