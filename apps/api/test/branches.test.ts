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
    data: { name: "Org Root", slug: "org-root" },
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
  expect(menuRes.status).toBe(201);
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

describe("multi-branch (integration)", () => {
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
    // Children first so the self-relation FK clears, then roots.
    await prisma.restaurantMembership.deleteMany();
    await prisma.restaurant.deleteMany({ where: { parentId: { not: null } } });
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
    ({ restaurant: { id: restaurantId } } = await seedOwner());
  });

  const branchesUrl = (id: string, path = "") =>
    `/api/v1/restaurants/${id}/branches${path}`;

  it("creates a branch and surfaces it in the workspace list", async () => {
    const res = await request(app)
      .post(branchesUrl(restaurantId))
      .set(asOwner())
      .send({ name: "Downtown", slug: "org-root-downtown" });
    expect(res.status).toBe(201);
    const branch = res.body.data;
    expect(branch.parentId).toBe(restaurantId);

    // Creator has explicit membership; GET /restaurants includes the branch.
    const mine = await request(app).get("/api/v1/restaurants").set(asOwner());
    const slugs = mine.body.data.map((m: { restaurant: { slug: string } }) => m.restaurant.slug);
    expect(slugs).toContain("org-root");
    expect(slugs).toContain("org-root-downtown");
  });

  it("lists branches with table/menu counts", async () => {
    await request(app)
      .post(branchesUrl(restaurantId))
      .set(asOwner())
      .send({ name: "Downtown", slug: "org-root-downtown" });

    const list = await request(app).get(branchesUrl(restaurantId)).set(asOwner());
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].name).toBe("Downtown");
    expect(list.body.data[0]._count).toEqual({ tables: 0, menus: 0 });
  });

  it("rejects branches of branches and duplicate slugs", async () => {
    const branch = await request(app)
      .post(branchesUrl(restaurantId))
      .set(asOwner())
      .send({ name: "Downtown", slug: "org-root-downtown" });
    const branchId = branch.body.data.id as string;

    const nested = await request(app)
      .post(branchesUrl(branchId))
      .set(asOwner())
      .send({ name: "Nested", slug: "nested" });
    expect(nested.status).toBe(400);
    expect(nested.body.error.code).toBe("BRANCH_OF_BRANCH");

    const dup = await request(app)
      .post(branchesUrl(restaurantId))
      .set(asOwner())
      .send({ name: "Other", slug: "org-root" });
    expect(dup.status).toBe(409);
  });

  it("gives parent members inherited access to branch resources", async () => {
    const branch = await request(app)
      .post(branchesUrl(restaurantId))
      .set(asOwner())
      .send({ name: "Downtown", slug: "org-root-downtown" });
    const branchId = branch.body.data.id as string;

    // A MANAGER of the parent (no branch membership) manages branch resources.
    const manager = await prisma.user.create({
      data: { clerkId: "clerk_manager", email: "manager@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: manager.id, restaurantId, role: "MANAGER" },
    });

    const createTable = await request(app)
      .post(`/api/v1/restaurants/${branchId}/tables`)
      .set(authHeader("clerk_manager"))
      .send({ label: "Table 1" });
    expect(createTable.status).toBe(201);

    const menus = await request(app)
      .get(`/api/v1/restaurants/${branchId}/menus`)
      .set(authHeader("clerk_manager"));
    expect(menus.status).toBe(200);

    // STAFF of the parent reads branch orders.
    const staff = await prisma.user.create({
      data: { clerkId: "clerk_staff", email: "staff@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: staff.id, restaurantId, role: "STAFF" },
    });
    const orders = await request(app)
      .get(`/api/v1/restaurants/${branchId}/orders`)
      .set(authHeader("clerk_staff"));
    expect(orders.status).toBe(200);
  });

  it("keeps branches isolated from outsiders and unrelated members", async () => {
    const branch = await request(app)
      .post(branchesUrl(restaurantId))
      .set(asOwner())
      .send({ name: "Downtown", slug: "org-root-downtown" });
    const branchId = branch.body.data.id as string;

    const other = await prisma.restaurant.create({
      data: { name: "Rival", slug: "rival" },
    });
    const rival = await prisma.user.create({
      data: { clerkId: "clerk_rival", email: "rival@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: rival.id, restaurantId: other.id, role: "OWNER" },
    });

    const denied = await request(app)
      .get(`/api/v1/restaurants/${branchId}/orders`)
      .set(authHeader("clerk_rival"));
    expect(denied.status).toBe(404);

    const anon = await request(app).get(`/api/v1/restaurants/${branchId}/orders`);
    expect(anon.status).toBe(401);

    // Rival's workspace list does not include our branch.
    const mine = await request(app).get("/api/v1/restaurants").set(authHeader("clerk_rival"));
    const slugs = mine.body.data.map((m: { restaurant: { slug: string } }) => m.restaurant.slug);
    expect(slugs).not.toContain("org-root-downtown");
  });

  it("aggregates organization analytics with a per-branch breakdown", async () => {
    await prisma.subscription.create({
      data: { restaurantId, plan: "PRO" },
    });
    const parentMenu = await createPublishedMenu(restaurantId);

    const branch = await request(app)
      .post(branchesUrl(restaurantId))
      .set(asOwner())
      .send({ name: "Downtown", slug: "org-root-downtown" });
    const branchId = branch.body.data.id as string;
    const branchMenu = await createPublishedMenu(branchId);

    // Parent order (paid) + branch order (paid).
    const parentTable = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/tables`)
      .set(asOwner())
      .send({ label: "T1" });
    const branchTable = await request(app)
      .post(`/api/v1/restaurants/${branchId}/tables`)
      .set(asOwner())
      .send({ label: "B1" });

    const parentOrder = await request(app)
      .post(`/api/v1/public/qr/${parentTable.body.data.qrToken}/orders`)
      .send({
        customerName: "Ana",
        customerPhone: "111",
        items: [{ menuItemId: parentMenu.itemId, quantity: 1 }],
      });
    const branchOrder = await request(app)
      .post(`/api/v1/public/qr/${branchTable.body.data.qrToken}/orders`)
      .send({
        customerName: "Bob",
        customerPhone: "222",
        items: [{ menuItemId: branchMenu.itemId, quantity: 1 }],
      });
    await prisma.order.update({
      where: { id: parentOrder.body.data.id },
      data: { status: "PAID" },
    });
    await prisma.order.update({
      where: { id: branchOrder.body.data.id },
      data: { status: "PAID" },
    });

    // Org scope: both orders, revenue 200, per-branch rows.
    const org = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/analytics?scope=org`)
      .set(asOwner());
    expect(org.status).toBe(200);
    expect(org.body.data.overview.totalOrders).toBe(2);
    expect(org.body.data.overview.revenue).toBe(200);
    expect(org.body.data.byBranch).toHaveLength(2);
    const byName = Object.fromEntries(
      org.body.data.byBranch.map((b: { name: string; orders: number; revenue: number }) => [
        b.name,
        b,
      ])
    );
    expect(byName["Org Root"].orders).toBe(1);
    expect(byName["Downtown"].revenue).toBe(100);

    // Restaurant scope: only the parent's order.
    const solo = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/analytics`)
      .set(asOwner());
    expect(solo.body.data.overview.totalOrders).toBe(1);
    expect(solo.body.data.byBranch).toHaveLength(0);
  });

  it("uses the root subscription for branch entitlements", async () => {
    const branch = await request(app)
      .post(branchesUrl(restaurantId))
      .set(asOwner())
      .send({ name: "Downtown", slug: "org-root-downtown" });
    const branchId = branch.body.data.id as string;

    // FREE root: branch analytics locked.
    const locked = await request(app)
      .get(`/api/v1/restaurants/${branchId}/analytics`)
      .set(asOwner());
    expect(locked.status).toBe(403);
    expect(locked.body.error.code).toBe("PLAN_FEATURE_LOCKED");

    // Upgrading the ROOT unlocks the branch (one plan per organization).
    await request(app)
      .put(`/api/v1/restaurants/${restaurantId}/subscription/plan`)
      .set(asOwner())
      .send({ plan: "STARTER" })
      .expect(200);

    const unlocked = await request(app)
      .get(`/api/v1/restaurants/${branchId}/analytics`)
      .set(asOwner());
    expect(unlocked.status).toBe(200);
  });
});
