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
    data: { name: "Offers House", slug: "offers-house" },
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
    .send({ name: "Pizza", price: 200 });
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
  quantity = 1
) {
  const res = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
    customerName: "Guest",
    customerPhone: "999",
    items: [{ menuItemId: itemId, quantity }],
  });
  expect(res.status).toBe(201);
  return res.body.data as {
    id: string;
    subtotal: number;
    discount: number;
    total: number;
    offerId: string | null;
  };
}

describe("offers & campaigns (integration)", () => {
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
    ({ itemId } = await createPublishedMenu(restaurantId));
    token = await createTable(restaurantId);
  });

  const offersUrl = (path = "") =>
    `/api/v1/restaurants/${restaurantId}/offers${path}`;

  it("creates, lists, edits, toggles and deletes offers (MANAGER+)", async () => {
    const created = await request(app)
      .post(offersUrl())
      .set(asOwner())
      .send({ title: "Happy Hour", badgeText: "20% OFF", discountType: "PERCENT", discountValue: 20 });
    expect(created.status).toBe(201);
    expect(created.body.data.discountType).toBe("PERCENT");
    const offerId = created.body.data.id as string;

    const list = await request(app).get(offersUrl()).set(asOwner());
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].title).toBe("Happy Hour");

    const patched = await request(app)
      .patch(offersUrl(`/${offerId}`))
      .set(asOwner())
      .send({ isActive: false, discountValue: 25 });
    expect(patched.status).toBe(200);
    expect(patched.body.data.isActive).toBe(false);
    expect(patched.body.data.discountValue).toBe(25);

    const del = await request(app).delete(offersUrl(`/${offerId}`)).set(asOwner());
    expect(del.status).toBe(200);
    expect(await prisma.offer.count()).toBe(0);
  });

  it("validates discount and schedule payloads", async () => {
    const noValue = await request(app)
      .post(offersUrl())
      .set(asOwner())
      .send({ title: "Broken", discountType: "PERCENT" });
    expect(noValue.status).toBe(400);
    expect(noValue.body.error.code).toBe("OFFER_INVALID_DISCOUNT");

    const hugePercent = await request(app)
      .post(offersUrl())
      .set(asOwner())
      .send({ title: "Broken", discountType: "PERCENT", discountValue: 150 });
    expect(hugePercent.status).toBe(400);

    const badWindow = await request(app)
      .post(offersUrl())
      .set(asOwner())
      .send({
        title: "Broken",
        startsAt: new Date("2030-01-02").toISOString(),
        endsAt: new Date("2030-01-01").toISOString(),
      });
    expect(badWindow.status).toBe(400);
    expect(badWindow.body.error.code).toBe("OFFER_INVALID_SCHEDULE");
  });

  it("only shows schedule-live offers on the customer menu", async () => {
    await prisma.offer.create({
      data: { restaurantId, title: "Live now", isActive: true },
    });
    await prisma.offer.create({
      data: {
        restaurantId,
        title: "Future",
        isActive: true,
        startsAt: new Date(Date.now() + 86_400_000),
      },
    });
    await prisma.offer.create({
      data: {
        restaurantId,
        title: "Expired",
        isActive: true,
        endsAt: new Date(Date.now() - 86_400_000),
      },
    });
    await prisma.offer.create({
      data: { restaurantId, title: "Inactive", isActive: false },
    });

    const res = await request(app).get(`/api/v1/public/qr/${token}/menu`);
    expect(res.status).toBe(200);
    const titles = res.body.data.offers.map((o: { title: string }) => o.title);
    expect(titles).toEqual(["Live now"]);
  });

  it("auto-applies the best live discount at order creation", async () => {
    await prisma.offer.create({
      data: {
        restaurantId,
        title: "10%",
        isActive: true,
        discountType: "PERCENT",
        discountValue: 10,
      },
    });
    await prisma.offer.create({
      data: {
        restaurantId,
        title: "Flat 30",
        isActive: true,
        discountType: "FLAT",
        discountValue: 30,
      },
    });

    const order = await placeOrder(token, itemId); // subtotal 200
    expect(order.subtotal).toBe(200);
    // Best of 10% (20) and flat 30 → 30.
    expect(order.discount).toBe(30);
    expect(order.total).toBe(170);
    expect(order.offerId).not.toBeNull();

    const offer = await prisma.offer.findUnique({ where: { id: order.offerId! } });
    expect(offer?.title).toBe("Flat 30");
  });

  it("does not discount for banner-only or out-of-window offers", async () => {
    await prisma.offer.create({
      data: { restaurantId, title: "Banner", isActive: true },
    });
    await prisma.offer.create({
      data: {
        restaurantId,
        title: "Expired deal",
        isActive: true,
        discountType: "FLAT",
        discountValue: 50,
        endsAt: new Date(Date.now() - 1000),
      },
    });

    const order = await placeOrder(token, itemId);
    expect(order.discount).toBe(0);
    expect(order.total).toBe(200);
    expect(order.offerId).toBeNull();
  });

  it("keeps offers tenant-scoped and enforces roles", async () => {
    const created = await request(app)
      .post(offersUrl())
      .set(asOwner())
      .send({ title: "Mine" });
    const offerId = created.body.data.id as string;

    const staff = await prisma.user.create({
      data: { clerkId: "clerk_staff", email: "staff@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: staff.id, restaurantId, role: "STAFF" },
    });
    const staffRes = await request(app).get(offersUrl()).set(authHeader("clerk_staff"));
    expect(staffRes.status).toBe(403);

    await prisma.user.create({ data: { clerkId: "clerk_out", email: "out@test.com" } });
    const outsider = await request(app).get(offersUrl()).set(authHeader("clerk_out"));
    expect(outsider.status).toBe(404);

    const anon = await request(app).get(offersUrl());
    expect(anon.status).toBe(401);

    const other = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-offers" },
    });
    const otherOwner = await prisma.user.create({
      data: { clerkId: "clerk_other", email: "other@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: otherOwner.id, restaurantId: other.id, role: "OWNER" },
    });
    const crossPatch = await request(app)
      .patch(`/api/v1/restaurants/${other.id}/offers/${offerId}`)
      .set(authHeader("clerk_other"))
      .send({ title: "Hijacked" });
    expect(crossPatch.status).toBe(404);
  });
});
