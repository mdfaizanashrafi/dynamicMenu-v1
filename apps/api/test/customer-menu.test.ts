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
    data: { name: "Customer Cafe", slug: "customer-cafe" },
  });
  await prisma.restaurantMembership.create({
    data: { userId: user.id, restaurantId: restaurant.id, role: "OWNER" },
  });
  return { user, restaurant };
}

const asOwner = () => authHeader("clerk_owner");

async function createTable(restaurantId: string, label = "Table 1") {
  const res = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/tables`)
    .set(asOwner())
    .send({ label });
  expect(res.status).toBe(201);
  return res.body.data as { id: string; qrToken: string };
}

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
    .send({ name: "Starters" });
  expect(sectionRes.status).toBe(201);
  const sectionId = sectionRes.body.data.id as string;

  const itemRes = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections/${sectionId}/items`)
    .set(asOwner())
    .send({
      name: "Soup",
      description: "Hot tomato soup",
      price: 120,
      isAvailable: true,
      dietaryTags: ["VEG"],
      variants: [{ name: "Large", price: 40, isAvailable: true }],
      addons: [{ name: "Garlic bread", price: 30, isAvailable: true }],
    });
  expect(itemRes.status).toBe(201);

  const publishRes = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus/${menuId}/publish`)
    .set(asOwner());
  expect(publishRes.status).toBe(200);

  return { menuId, sectionId, itemId: itemRes.body.data.id as string };
}

describe("customer menu (integration)", () => {
  let restaurantId = "";

  beforeEach(async () => {
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
  });

  it("returns restaurant, table, published menu snapshot, theme and active offers publicly", async () => {
    const table = await createTable(restaurantId, "Table 5");
    const { sectionId } = await createPublishedMenu(restaurantId);

    await prisma.restaurantTheme.create({
      data: {
        restaurantId,
        publishedConfig: {
          preset: "modern-minimal",
          colors: {
            primary: "#e11d48",
            secondary: "#fff1f2",
            background: "#ffffff",
            surface: "#f8fafc",
            text: "#0f172a",
          },
          headingFont: "sans",
          cardStyle: "soft",
          buttonStyle: "rounded",
          backgroundStyle: "solid",
          headerStyle: "logo",
          decorations: { garland: false, cornerFlourish: false },
          coverImageUrl: null,
        },
      },
    });

    await prisma.offer.create({
      data: {
        restaurantId,
        title: "Happy Hour",
        description: "20% off starters",
        badgeText: "20% OFF",
        isActive: true,
        position: 0,
      },
    });
    await prisma.offer.create({
      data: {
        restaurantId,
        title: "Inactive offer",
        isActive: false,
      },
    });

    const res = await request(app).get(`/api/v1/public/qr/${table.qrToken}/menu`);
    expect(res.status).toBe(200);

    const data = res.body.data;
    expect(data.restaurant).toMatchObject({
      name: "Customer Cafe",
      slug: "customer-cafe",
      logoUrl: null,
    });
    expect(data.table).toEqual({ label: "Table 5" });
    expect(data.menu.sections).toHaveLength(1);
    expect(data.menu.sections[0].id).toBe(sectionId);
    expect(data.menu.sections[0].items[0]).toMatchObject({
      name: "Soup",
      price: 120,
      dietaryTags: ["VEG"],
    });
    expect(data.menu.sections[0].items[0].variants[0]).toMatchObject({
      name: "Large",
      price: 40,
    });
    expect(data.theme.preset).toBe("modern-minimal");
    expect(data.offers).toHaveLength(1);
    expect(data.offers[0].title).toBe("Happy Hour");

    // Internal IDs must not leak in the public payload.
    const payload = JSON.stringify(data);
    expect(payload).not.toContain(table.id);
    expect(payload).not.toContain(restaurantId);
  });

  it("falls back to the default theme and empty offers when none exist", async () => {
    const table = await createTable(restaurantId);
    await createPublishedMenu(restaurantId);

    const res = await request(app).get(`/api/v1/public/qr/${table.qrToken}/menu`);
    expect(res.status).toBe(200);
    expect(res.body.data.theme.preset).toBeDefined();
    expect(res.body.data.offers).toEqual([]);
  });

  it("returns menu null when the restaurant has no published menu", async () => {
    const table = await createTable(restaurantId);

    const res = await request(app).get(`/api/v1/public/qr/${table.qrToken}/menu`);
    expect(res.status).toBe(200);
    expect(res.body.data.menu).toBeNull();
    expect(res.body.data.restaurant.name).toBe("Customer Cafe");
  });

  it("rejects inactive/unknown tokens on the menu endpoint", async () => {
    const unknown = await request(app).get("/api/v1/public/qr/nope/menu");
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe("INVALID_QR");

    const table = await createTable(restaurantId);
    await request(app)
      .patch(`/api/v1/restaurants/${restaurantId}/tables/${table.id}`)
      .set(asOwner())
      .send({ isActive: false });

    const inactive = await request(app).get(`/api/v1/public/qr/${table.qrToken}/menu`);
    expect(inactive.status).toBe(404);
  });

  it("does not expose another restaurant's menu through this token", async () => {
    await createTable(restaurantId);
    await createPublishedMenu(restaurantId);

    const other = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-cafe" },
    });
    const otherToken = "x".repeat(24);
    await prisma.restaurantTable.create({
      data: { restaurantId: other.id, label: "T1", qrToken: otherToken },
    });

    const res = await request(app).get(`/api/v1/public/qr/${otherToken}/menu`);
    expect(res.status).toBe(200);
    expect(res.body.data.restaurant.slug).toBe("other-cafe");
    expect(res.body.data.menu).toBeNull();
  });
});
