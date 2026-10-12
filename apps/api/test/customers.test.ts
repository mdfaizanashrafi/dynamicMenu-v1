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
    data: { name: "Customer House", slug: "customer-house" },
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
  const itemRes = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections/${sectionId}/items`)
    .set(asOwner())
    .send({ name: "Burger", price: 100 });
  const itemId = itemRes.body.data.id as string;
  await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus/${menuId}/publish`)
    .set(asOwner());
  return { itemId };
}

async function createTable(restaurantId: string, label = "Table 1") {
  const res = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/tables`)
    .set(asOwner())
    .send({ label });
  return res.body.data.qrToken as string;
}

async function placeOrder(
  token: string,
  itemId: string,
  customer: { name: string; phone: string }
) {
  const res = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
    customerName: customer.name,
    customerPhone: customer.phone,
    items: [{ menuItemId: itemId, quantity: 2 }],
  });
  expect(res.status).toBe(201);
  return res.body.data;
}

describe("customer management (integration)", () => {
  let restaurantId = "";
  let itemId = "";
  let token = "";

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
    ({ itemId } = await createPublishedMenu(restaurantId));
    token = await createTable(restaurantId);
  });

  const customersUrl = (path = "") =>
    `/api/v1/restaurants/${restaurantId}/customers${path}`;

  it("creates customer profiles from orders and aggregates their spend", async () => {
    await placeOrder(token, itemId, { name: "Alice", phone: "111" });
    await placeOrder(token, itemId, { name: "Alice A.", phone: "111" });
    await placeOrder(token, itemId, { name: "Bob", phone: "222" });

    const customers = await prisma.customer.findMany({ where: { restaurantId } });
    expect(customers).toHaveLength(2);
    const alice = customers.find((c) => c.phone === "111")!;
    expect(alice.name).toBe("Alice A."); // latest order wins

    const res = await request(app).get(customersUrl()).set(asOwner());
    expect(res.status).toBe(200);
    const list = res.body.data as { phone: string; orderCount: number; totalSpent: number }[];
    const aliceDto = list.find((c) => c.phone === "111")!;
    expect(aliceDto.orderCount).toBe(2);
    expect(aliceDto.totalSpent).toBe(400); // 2 orders × 2 × 100
    const bobDto = list.find((c) => c.phone === "222")!;
    expect(bobDto.orderCount).toBe(1);
  });

  it("searches customers by name or phone", async () => {
    await placeOrder(token, itemId, { name: "Alice", phone: "111" });
    await placeOrder(token, itemId, { name: "Bob", phone: "222" });

    const byName = await request(app).get(customersUrl("?q=ali")).set(asOwner());
    expect(byName.body.data).toHaveLength(1);
    expect(byName.body.data[0].name).toBe("Alice");

    const byPhone = await request(app).get(customersUrl("?q=222")).set(asOwner());
    expect(byPhone.body.data).toHaveLength(1);
    expect(byPhone.body.data[0].phone).toBe("222");
  });

  it("returns order history and insights for MANAGER+", async () => {
    await placeOrder(token, itemId, { name: "Alice", phone: "111" });
    await placeOrder(token, itemId, { name: "Alice", phone: "111" });
    const order = await placeOrder(token, itemId, { name: "Alice", phone: "111" });
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });

    const customer = await prisma.customer.findFirstOrThrow({
      where: { restaurantId, phone: "111" },
    });

    const res = await request(app)
      .get(customersUrl(`/${customer.id}`))
      .set(asOwner());
    expect(res.status).toBe(200);
    const detail = res.body.data;
    expect(detail.orderCount).toBe(3);
    expect(detail.totalSpent).toBe(600);
    expect(detail.averageOrderValue).toBe(200);
    expect(detail.favoriteItem).toBe("Burger");
    expect(detail.recentOrders).toHaveLength(3);
    expect(detail.recentOrders[0].status).toBe("PAID");
    expect(detail.firstOrderAt).toBeTruthy();
    expect(detail.lastOrderAt).toBeTruthy();
  });

  it("limits STAFF to the list (no emails) and blocks detail access", async () => {
    await placeOrder(token, itemId, {
      name: "Alice",
      phone: "111",
    });
    await prisma.customer.updateMany({
      where: { restaurantId },
      data: { email: "alice@test.com" },
    });

    const staff = await prisma.user.create({
      data: { clerkId: "clerk_staff", email: "staff@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: staff.id, restaurantId, role: "STAFF" },
    });

    const list = await request(app).get(customersUrl()).set(authHeader("clerk_staff"));
    expect(list.status).toBe(200);
    expect(list.body.data[0].email).toBeNull();

    const customer = await prisma.customer.findFirstOrThrow({ where: { restaurantId } });
    const detail = await request(app)
      .get(customersUrl(`/${customer.id}`))
      .set(authHeader("clerk_staff"));
    expect(detail.status).toBe(403);
  });

  it("rejects outsiders and unauthenticated callers", async () => {
    await placeOrder(token, itemId, { name: "Alice", phone: "111" });
    await prisma.user.create({
      data: { clerkId: "clerk_out", email: "out@test.com" },
    });

    const outsider = await request(app)
      .get(customersUrl())
      .set(authHeader("clerk_out"));
    expect(outsider.status).toBe(404);

    const anon = await request(app).get(customersUrl());
    expect(anon.status).toBe(401);
  });

  it("keeps customers tenant-scoped", async () => {
    await placeOrder(token, itemId, { name: "Alice", phone: "111" });
    const customer = await prisma.customer.findFirstOrThrow({ where: { restaurantId } });

    const other = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-customers" },
    });
    const crossList = await request(app)
      .get(`/api/v1/restaurants/${other.id}/customers`)
      .set(asOwner());
    expect(crossList.status).toBe(404); // owner is not a member of "other"

    // A member of the other restaurant cannot see this customer.
    const otherOwner = await prisma.user.create({
      data: { clerkId: "clerk_other", email: "other@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: otherOwner.id, restaurantId: other.id, role: "OWNER" },
    });
    const crossDetail = await request(app)
      .get(`/api/v1/restaurants/${other.id}/customers/${customer.id}`)
      .set(authHeader("clerk_other"));
    expect(crossDetail.status).toBe(404);
  });
});
