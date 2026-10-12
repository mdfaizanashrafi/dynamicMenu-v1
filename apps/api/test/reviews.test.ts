import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/app.js";
import { createStubVerifier } from "./helpers.js";

const app = createApp(createStubVerifier());

async function seedOwner() {
  const user = await prisma.user.create({
    data: { clerkId: "clerk_owner", email: "owner@test.com" },
  });
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Review Cafe",
      slug: "review-cafe",
      googleMapsUrl: "https://maps.google.com/review-cafe",
    },
  });
  await prisma.restaurantMembership.create({
    data: { userId: user.id, restaurantId: restaurant.id, role: "OWNER" },
  });
  return { user, restaurant };
}

async function createTable(restaurantId: string, label = "Table 1") {
  return prisma.restaurantTable.create({
    data: {
      restaurantId,
      label,
      qrToken: crypto.randomUUID().replace(/-/g, "").slice(0, 24),
    },
  });
}

async function createOrder(restaurantId: string, tableId: string) {
  return prisma.order.create({
    data: {
      restaurantId,
      tableId,
      customerName: "Guest",
      customerPhone: "555-0100",
      subtotal: new Prisma.Decimal(150),
      total: new Prisma.Decimal(150),
    },
  });
}

describe("payment status & reviews (integration)", () => {
  let restaurantId = "";
  let tableId = "";
  let token = "";

  beforeEach(async () => {
    await prisma.review.deleteMany();
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
    token = table.qrToken;
  });

  const statusUrl = (orderId: string) =>
    `/api/v1/public/qr/${token}/orders/${orderId}`;
  const reviewUrl = (orderId: string) => `${statusUrl(orderId)}/review`;
  const googleUrl = (orderId: string) => `${statusUrl(orderId)}/review/google`;

  it("returns order status with review eligibility and restaurant Google URL", async () => {
    const order = await createOrder(restaurantId, tableId);

    const res = await request(app).get(statusUrl(order.id));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      status: "PENDING",
      reviewEligible: false,
      restaurant: { name: "Review Cafe", googleMapsUrl: "https://maps.google.com/review-cafe" },
      review: null,
    });
  });

  it("rejects reviews until the order is marked paid", async () => {
    const order = await createOrder(restaurantId, tableId);

    const early = await request(app).post(reviewUrl(order.id)).send({ rating: 5 });
    expect(early.status).toBe(400);
    expect(early.body.error.code).toBe("REVIEW_NOT_ELIGIBLE");

    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });

    const ok = await request(app)
      .post(reviewUrl(order.id))
      .send({ rating: 5, comment: "Great food" });
    expect(ok.status).toBe(201);
    expect(ok.body.data.rating).toBe(5);
    expect(ok.body.data.comment).toBe("Great food");
    expect(ok.body.data.googleMapsOpenedAt).toBeNull();

    const status = await request(app).get(statusUrl(order.id));
    expect(status.body.data.reviewEligible).toBe(true);
    expect(status.body.data.review.id).toBe(ok.body.data.id);
  });

  it("keeps one review per order (idempotent upsert)", async () => {
    const order = await createOrder(restaurantId, tableId);
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });

    await request(app).post(reviewUrl(order.id)).send({ rating: 4 });
    const resubmit = await request(app)
      .post(reviewUrl(order.id))
      .send({ rating: 5, comment: "Even better" });
    expect(resubmit.status).toBe(201);
    expect(resubmit.body.data.rating).toBe(5);

    const count = await prisma.review.count({ where: { orderId: order.id } });
    expect(count).toBe(1);
  });

  it("validates rating range", async () => {
    const order = await createOrder(restaurantId, tableId);
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });

    const zero = await request(app).post(reviewUrl(order.id)).send({ rating: 0 });
    expect(zero.status).toBe(400);
    const six = await request(app).post(reviewUrl(order.id)).send({ rating: 6 });
    expect(six.status).toBe(400);
  });

  it("tracks the Google Maps redirect without claiming a posted review", async () => {
    const order = await createOrder(restaurantId, tableId);
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });

    const before = await request(app).post(googleUrl(order.id));
    expect(before.status).toBe(400);
    expect(before.body.error.code).toBe("REVIEW_NOT_SUBMITTED");

    await request(app).post(reviewUrl(order.id)).send({ rating: 5 });

    const click = await request(app).post(googleUrl(order.id));
    expect(click.status).toBe(200);
    expect(click.body.data.googleMapsUrl).toBe("https://maps.google.com/review-cafe");
    expect(click.body.data.review.googleMapsOpenedAt).not.toBeNull();

    const again = await request(app).post(googleUrl(order.id));
    expect(again.status).toBe(200);
    expect(again.body.data.review.googleMapsOpenedAt).toBe(
      click.body.data.review.googleMapsOpenedAt
    );
  });

  it("scopes the order to the scanned table's token", async () => {
    const order = await createOrder(restaurantId, tableId);
    const otherTable = await createTable(restaurantId, "Table 9");

    const wrongToken = await request(app).get(
      `/api/v1/public/qr/${otherTable.qrToken}/orders/${order.id}`
    );
    expect(wrongToken.status).toBe(404);
    expect(wrongToken.body.error.code).toBe("ORDER_NOT_FOUND");

    const unknownOrder = await request(app).get(statusUrl("does-not-exist"));
    expect(unknownOrder.status).toBe(404);
  });
});
