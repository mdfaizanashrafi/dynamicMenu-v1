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
    data: { name: "Billing House", slug: "billing-house" },
  });
  await prisma.restaurantMembership.create({
    data: { userId: user.id, restaurantId: restaurant.id, role: "OWNER" },
  });
  return { user, restaurant };
}

const asOwner = () => authHeader("clerk_owner");

describe("subscriptions & entitlements (integration)", () => {
  let restaurantId = "";

  beforeEach(async () => {
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.loyaltyAccount.deleteMany();
    await prisma.review.deleteMany();
    await prisma.orderItemAddon.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.subscription.deleteMany();
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
  });

  const subUrl = (path = "") =>
    `/api/v1/restaurants/${restaurantId}/subscription${path}`;

  it("auto-provisions a FREE subscription and reports usage", async () => {
    const res = await request(app).get(subUrl()).set(asOwner());
    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe("FREE");
    expect(res.body.data.status).toBe("ACTIVE");
    expect(res.body.data.usage.tables).toEqual({ used: 0, limit: 3 });
    expect(res.body.data.usage.menus).toEqual({ used: 0, limit: 2 });
    expect(res.body.data.usage.offers).toEqual({ used: 0, limit: 2 });
    expect(res.body.data.plans).toHaveLength(4);
    expect(res.body.data.plans.find((p: { current: boolean }) => p.current).key).toBe("FREE");

    const row = await prisma.subscription.findUnique({ where: { restaurantId } });
    expect(row?.plan).toBe("FREE");
  });

  it("enforces plan usage limits and frees them after upgrade", async () => {
    // FREE allows 3 tables; the 4th is rejected.
    for (let i = 1; i <= 3; i++) {
      const res = await request(app)
        .post(`/api/v1/restaurants/${restaurantId}/tables`)
        .set(asOwner())
        .send({ label: `Table ${i}` });
      expect(res.status).toBe(201);
    }
    const blocked = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/tables`)
      .set(asOwner())
      .send({ label: "Table 4" });
    expect(blocked.status).toBe(402);
    expect(blocked.body.error.code).toBe("PLAN_LIMIT_REACHED");

    // Upgrade → create succeeds.
    const upgrade = await request(app)
      .put(subUrl("/plan"))
      .set(asOwner())
      .send({ plan: "STARTER" });
    expect(upgrade.status).toBe(200);
    expect(upgrade.body.data.plan).toBe("STARTER");

    const ok = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/tables`)
      .set(asOwner())
      .send({ label: "Table 4" });
    expect(ok.status).toBe(201);
  });

  it("enforces menu and offer limits too", async () => {
    for (let i = 1; i <= 2; i++) {
      await request(app)
        .post(`/api/v1/restaurants/${restaurantId}/menus`)
        .set(asOwner())
        .send({ name: `Menu ${i}` })
        .expect(201);
    }
    const thirdMenu = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus`)
      .set(asOwner())
      .send({ name: "Menu 3" });
    expect(thirdMenu.status).toBe(402);

    for (let i = 1; i <= 2; i++) {
      await request(app)
        .post(`/api/v1/restaurants/${restaurantId}/offers`)
        .set(asOwner())
        .send({ title: `Offer ${i}` })
        .expect(201);
    }
    const thirdOffer = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/offers`)
      .set(asOwner())
      .send({ title: "Offer 3" });
    expect(thirdOffer.status).toBe(402);
  });

  it("gates features: analytics and loyalty are locked on FREE, unlocked on PRO", async () => {
    const analyticsBlocked = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/analytics`)
      .set(asOwner());
    expect(analyticsBlocked.status).toBe(403);
    expect(analyticsBlocked.body.error.code).toBe("PLAN_FEATURE_LOCKED");

    const loyaltyBlocked = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/loyalty/redeem`)
      .set(asOwner())
      .send({ phone: "111", points: 1 });
    expect(loyaltyBlocked.status).toBe(403);
    expect(loyaltyBlocked.body.error.code).toBe("PLAN_FEATURE_LOCKED");

    await request(app).put(subUrl("/plan")).set(asOwner()).send({ plan: "PRO" }).expect(200);

    // Analytics now reachable (empty data is fine); loyalty redeem fails only
    // on the missing customer, not the feature gate.
    const analyticsOk = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/analytics`)
      .set(asOwner());
    expect(analyticsOk.status).toBe(200);

    const loyaltyOk = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/loyalty/redeem`)
      .set(asOwner())
      .send({ phone: "111", points: 1 });
    expect(loyaltyOk.status).toBe(404); // CUSTOMER_NOT_FOUND, past the gate
  });

  it("restricts plan changes to OWNER", async () => {
    const manager = await prisma.user.create({
      data: { clerkId: "clerk_manager", email: "manager@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: manager.id, restaurantId, role: "MANAGER" },
    });

    const denied = await request(app)
      .put(subUrl("/plan"))
      .set(authHeader("clerk_manager"))
      .send({ plan: "PRO" });
    expect(denied.status).toBe(403);

    // Managers can still view the subscription.
    const view = await request(app).get(subUrl()).set(authHeader("clerk_manager"));
    expect(view.status).toBe(200);

    await prisma.user.create({ data: { clerkId: "clerk_out", email: "out@test.com" } });
    const outsider = await request(app).get(subUrl()).set(authHeader("clerk_out"));
    expect(outsider.status).toBe(404);
  });

  it("keeps subscriptions tenant-isolated", async () => {
    const other = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-billing" },
    });
    const otherOwner = await prisma.user.create({
      data: { clerkId: "clerk_other", email: "other@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: otherOwner.id, restaurantId: other.id, role: "OWNER" },
    });

    await request(app)
      .put(`/api/v1/restaurants/${other.id}/subscription/plan`)
      .set(authHeader("clerk_other"))
      .send({ plan: "PRO" })
      .expect(200);

    // Our restaurant is untouched.
    const mine = await request(app).get(subUrl()).set(asOwner());
    expect(mine.body.data.plan).toBe("FREE");
  });
});
