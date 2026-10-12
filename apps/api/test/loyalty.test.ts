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
    data: { name: "Loyalty House", slug: "loyalty-house" },
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

async function placeOrderAndPay(
  restaurantId: string,
  token: string,
  itemId: string,
  customer: { name: string; phone: string },
  quantity: number
) {
  const orderRes = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
    customerName: customer.name,
    customerPhone: customer.phone,
    items: [{ menuItemId: itemId, quantity }],
  });
  expect(orderRes.status).toBe(201);
  const orderId = orderRes.body.data.id as string;

  for (const status of ["CONFIRMED", "PREPARING", "READY", "SERVED", "PAID"]) {
    const res = await request(app)
      .patch(`/api/v1/restaurants/${restaurantId}/orders/${orderId}`)
      .set(asOwner())
      .send({ status });
    expect(res.status).toBe(200);
  }
  return orderId;
}

describe("loyalty program (integration)", () => {
  let restaurantId = "";
  let itemId = "";
  let token = "";

  beforeEach(async () => {
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.loyaltyAccount.deleteMany();
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
    // Loyalty is a paid feature (Phase 14 entitlements).
    await prisma.subscription.create({
      data: { restaurantId, plan: "PRO" },
    });
    ({ itemId } = await createPublishedMenu(restaurantId));
    token = await createTable(restaurantId);
  });

  const loyaltyUrl = (path = "") =>
    `/api/v1/restaurants/${restaurantId}/loyalty${path}`;

  it("awards points when an order is marked paid (1 per 100 spent, floored)", async () => {
    const alice = { name: "Alice", phone: "111" };
    await placeOrderAndPay(restaurantId, token, itemId, alice, 2); // 200 → 2 pts
    await placeOrderAndPay(restaurantId, token, itemId, alice, 1); // 100 → 1 pt

    const account = await prisma.loyaltyAccount.findFirst({
      where: { customer: { restaurantId, phone: "111" } },
      include: { transactions: true },
    });
    expect(account).not.toBeNull();
    expect(account!.points).toBe(3);
    expect(account!.lifetimeEarned).toBe(3);
    expect(account!.transactions.filter((t) => t.type === "EARN")).toHaveLength(2);
    expect(account!.transactions.every((t) => t.orderId)).toBe(true);
  });

  it("never double-awards points (idempotent per order)", async () => {
    const alice = { name: "Alice", phone: "111" };
    await placeOrderAndPay(restaurantId, token, itemId, alice, 2);

    // Simulate a duplicate award call (retry safety).
    const { awardPointsForOrder } = await import("../src/modules/loyalty/loyalty.service.js");
    const order = await prisma.order.findFirstOrThrow({ where: { restaurantId } });
    await awardPointsForOrder(order.id);

    const account = await prisma.loyaltyAccount.findFirst({
      where: { customer: { restaurantId, phone: "111" } },
    });
    expect(account!.points).toBe(2);

    // PAID → COMPLETED must not award again.
    await request(app)
      .patch(`/api/v1/restaurants/${restaurantId}/orders/${order.id}`)
      .set(asOwner())
      .send({ status: "COMPLETED" });
    const after = await prisma.loyaltyAccount.findFirst({
      where: { customer: { restaurantId, phone: "111" } },
    });
    expect(after!.points).toBe(2);
  });

  it("redeems points at the counter and blocks over-redemption", async () => {
    await placeOrderAndPay(restaurantId, token, itemId, { name: "Alice", phone: "111" }, 5); // 5 pts

    const redeem = await request(app)
      .post(loyaltyUrl("/redeem"))
      .set(asOwner())
      .send({ phone: "111", points: 2, reason: "Free coffee" });
    expect(redeem.status).toBe(200);
    expect(redeem.body.data.points).toBe(3);
    expect(redeem.body.data.lifetimeRedeemed).toBe(2);

    const tooMuch = await request(app)
      .post(loyaltyUrl("/redeem"))
      .set(asOwner())
      .send({ phone: "111", points: 99 });
    expect(tooMuch.status).toBe(400);
    expect(tooMuch.body.error.code).toBe("LOYALTY_INSUFFICIENT_POINTS");

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { account: { customer: { restaurantId, phone: "111" } } },
    });
    expect(transactions.filter((t) => t.type === "REDEEM")).toHaveLength(1);
  });

  it("lists accounts for MANAGER+ with search, and hides the list from STAFF", async () => {
    await placeOrderAndPay(restaurantId, token, itemId, { name: "Alice", phone: "111" }, 3);
    await placeOrderAndPay(restaurantId, token, itemId, { name: "Bob", phone: "222" }, 1);

    const list = await request(app).get(loyaltyUrl("/accounts")).set(asOwner());
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(2);
    expect(list.body.data[0].name).toBe("Alice"); // 3 pts > 1 pt
    expect(list.body.data[0].points).toBe(3);

    const search = await request(app).get(loyaltyUrl("/accounts?q=bob")).set(asOwner());
    expect(search.body.data).toHaveLength(1);
    expect(search.body.data[0].name).toBe("Bob");

    const staff = await prisma.user.create({
      data: { clerkId: "clerk_staff", email: "staff@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: staff.id, restaurantId, role: "STAFF" },
    });
    const staffList = await request(app)
      .get(loyaltyUrl("/accounts"))
      .set(authHeader("clerk_staff"));
    expect(staffList.status).toBe(403);

    // But staff CAN redeem at the counter.
    const staffRedeem = await request(app)
      .post(loyaltyUrl("/redeem"))
      .set(authHeader("clerk_staff"))
      .send({ phone: "111", points: 1 });
    expect(staffRedeem.status).toBe(200);
  });

  it("exposes loyalty balance on the customer order page and customer detail", async () => {
    await placeOrderAndPay(restaurantId, token, itemId, { name: "Alice", phone: "111" }, 4);
    const order = await prisma.order.findFirstOrThrow({ where: { restaurantId } });
    const table = await prisma.restaurantTable.findFirstOrThrow({ where: { restaurantId } });

    const status = await request(app).get(
      `/api/v1/public/qr/${table.qrToken}/orders/${order.id}`
    );
    expect(status.status).toBe(200);
    expect(status.body.data.loyalty).toEqual({ points: 4 });

    const customer = await prisma.customer.findFirstOrThrow({ where: { restaurantId } });
    const detail = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/customers/${customer.id}`)
      .set(asOwner());
    expect(detail.body.data.loyalty.points).toBe(4);
    expect(detail.body.data.loyalty.transactions).toHaveLength(1);
    expect(detail.body.data.loyalty.transactions[0].type).toBe("EARN");
  });

  it("keeps loyalty data tenant-scoped", async () => {
    await placeOrderAndPay(restaurantId, token, itemId, { name: "Alice", phone: "111" }, 2);

    const other = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-loyalty" },
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

    // Other restaurant cannot redeem against this customer (phone not found there).
    const crossRedeem = await request(app)
      .post(`/api/v1/restaurants/${other.id}/loyalty/redeem`)
      .set(authHeader("clerk_other"))
      .send({ phone: "111", points: 1 });
    expect(crossRedeem.status).toBe(404);

    // And this restaurant's account list is invisible there.
    const crossList = await request(app)
      .get(`/api/v1/restaurants/${other.id}/loyalty/accounts`)
      .set(authHeader("clerk_other"));
    expect(crossList.status).toBe(200);
    expect(crossList.body.data).toHaveLength(0);
  });

  it("requires customerId or phone for redemption", async () => {
    const res = await request(app)
      .post(loyaltyUrl("/redeem"))
      .set(asOwner())
      .send({ points: 1 });
    expect(res.status).toBe(400);
  });
});
