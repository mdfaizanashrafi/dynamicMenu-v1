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
    data: { name: "Order House", slug: "order-house" },
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
  expect(sectionRes.status).toBe(201);
  const sectionId = sectionRes.body.data.id as string;

  const itemRes = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections/${sectionId}/items`)
    .set(asOwner())
    .send({
      name: "Burger",
      description: "Juicy beef burger",
      price: 250,
      isAvailable: true,
      dietaryTags: ["NON_VEG"],
      variants: [
        { name: "Double patty", price: 120, isAvailable: true },
        { name: "Unavailable size", price: 200, isAvailable: false },
      ],
      addons: [
        { name: "Cheese", price: 40, isAvailable: true },
        { name: "Bacon", price: 60, isAvailable: true },
      ],
    });
  expect(itemRes.status).toBe(201);

  await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus/${menuId}/publish`)
    .set(asOwner())
    .expect(200);

  const itemId = itemRes.body.data.id as string;
  const doublePatty = await prisma.menuItemVariant.findFirst({
    where: { itemId, name: "Double patty" },
  });
  const cheese = await prisma.menuItemAddon.findFirst({
    where: { itemId, name: "Cheese" },
  });
  if (!doublePatty || !cheese) {
    throw new Error("seeded variant/addon missing");
  }

  return {
    menuId,
    itemId,
    variantId: doublePatty.id,
    cheeseId: cheese.id,
  };
}

async function createTable(restaurantId: string, label = "Table 1") {
  const res = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/tables`)
    .set(asOwner())
    .send({ label });
  expect(res.status).toBe(201);
  return res.body.data.qrToken as string;
}

describe("orders (integration)", () => {
  let restaurantId = "";

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
  });

  it("creates an order with table association and recomputed prices", async () => {
    const { itemId, variantId, cheeseId } = await createPublishedMenu(restaurantId);
    const token = await createTable(restaurantId, "Table 7");

    const res = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerName: "Alice",
      customerPhone: "+1234567890",
      items: [
        { menuItemId: itemId, quantity: 2, variantId, addonIds: [cheeseId] },
      ],
    });

    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(order.status).toBe("PENDING");
    expect(order.customerName).toBe("Alice");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(2);
    // Unit = 250 + 120 + 40 = 410; total = 820
    expect(order.total).toBe(820);
    expect(order.items[0].subtotal).toBe(820);
    expect(order.items[0].variantName).toBe("Double patty");
    expect(order.items[0].addons).toHaveLength(1);
    expect(order.items[0].addons[0].name).toBe("Cheese");

    const dbOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    expect(dbOrder).not.toBeNull();
    expect(dbOrder!.tableId).toBeTruthy();
    expect(dbOrder!.restaurantId).toBe(restaurantId);
    expect(dbOrder!.total.toNumber()).toBe(820);
  });

  it("ignores frontend-provided prices and totals", async () => {
    const { itemId } = await createPublishedMenu(restaurantId);
    const token = await createTable(restaurantId);

    const res = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerName: "Bob",
      customerPhone: "555-1234",
      items: [{ menuItemId: itemId, quantity: 1, price: 1, total: 1 }],
    });

    expect(res.status).toBe(201);
    expect(res.body.data.total).toBe(250); // real base price, not 1
  });

  it("rejects orders for unavailable items, variants, and addons", async () => {
    const { itemId, cheeseId } = await createPublishedMenu(restaurantId);
    const token = await createTable(restaurantId);

    // Make item unavailable after publishing.
    await prisma.menuItem.update({ where: { id: itemId }, data: { isAvailable: false } });

    const unavailable = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerName: "Carol",
      customerPhone: "555-0000",
      items: [{ menuItemId: itemId, quantity: 1 }],
    });
    expect(unavailable.status).toBe(400);
    expect(unavailable.body.error.code).toBe("ORDER_INVALID_ITEM");

    // Re-enable item; test unavailable variant.
    await prisma.menuItem.update({ where: { id: itemId }, data: { isAvailable: true } });
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { variants: true },
    });
    const badVariant = item!.variants.find((v) => !v.isAvailable)!;

    const badVariantRes = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerName: "Carol",
      customerPhone: "555-0000",
      items: [{ menuItemId: itemId, quantity: 1, variantId: badVariant.id }],
    });
    expect(badVariantRes.status).toBe(400);
    expect(badVariantRes.body.error.code).toBe("ORDER_INVALID_VARIANT");

    // Disable an addon.
    await prisma.menuItemAddon.update({ where: { id: cheeseId }, data: { isAvailable: false } });
    const goodVariant = item!.variants.find((v) => v.isAvailable)!;

    const badAddonRes = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerName: "Carol",
      customerPhone: "555-0000",
      items: [
        { menuItemId: itemId, quantity: 1, variantId: goodVariant.id, addonIds: [cheeseId] },
      ],
    });
    expect(badAddonRes.status).toBe(400);
    expect(badAddonRes.body.error.code).toBe("ORDER_INVALID_ADDON");
  });

  it("rejects invalid or foreign item/variant/addon ids", async () => {
    const { itemId } = await createPublishedMenu(restaurantId);
    const token = await createTable(restaurantId);

    const otherRestaurant = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-order" },
    });
    const otherMenu = await prisma.menu.create({
      data: { restaurantId: otherRestaurant.id, name: "Other", status: "PUBLISHED" },
    });
    const otherSection = await prisma.menuSection.create({
      data: { menuId: otherMenu.id, name: "S" },
    });
    const otherItem = await prisma.menuItem.create({
      data: { sectionId: otherSection.id, name: "Other", price: 10 },
    });

    const foreign = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerName: "Dave",
      customerPhone: "555-9999",
      items: [{ menuItemId: otherItem.id, quantity: 1 }],
    });
    expect(foreign.status).toBe(400);
    expect(foreign.body.error.code).toBe("ORDER_INVALID_ITEM");

    const bogus = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerName: "Dave",
      customerPhone: "555-9999",
      items: [{ menuItemId: itemId, quantity: 1, variantId: "does-not-exist" }],
    });
    expect(bogus.status).toBe(400);
    expect(bogus.body.error.code).toBe("ORDER_INVALID_VARIANT");
  });

  it("requires customer name, phone, and at least one item", async () => {
    const { itemId } = await createPublishedMenu(restaurantId);
    const token = await createTable(restaurantId);

    const noItems = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerName: "Eve",
      customerPhone: "555-1111",
      items: [],
    });
    expect(noItems.status).toBe(400);

    const noName = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerPhone: "555-1111",
      items: [{ menuItemId: itemId, quantity: 1 }],
    });
    expect(noName.status).toBe(400);

    const noPhone = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerName: "Eve",
      items: [{ menuItemId: itemId, quantity: 1 }],
    });
    expect(noPhone.status).toBe(400);
  });

  it("rejects orders when the restaurant has no published menu", async () => {
    const token = await createTable(restaurantId);

    const res = await request(app).post(`/api/v1/public/qr/${token}/orders`).send({
      customerName: "Frank",
      customerPhone: "555-2222",
      items: [{ menuItemId: "fake", quantity: 1 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("ORDER_MENU_UNAVAILABLE");
  });

  it("rejects inactive or unknown QR tokens", async () => {
    const unknown = await request(app).post("/api/v1/public/qr/nope/orders").send({
      customerName: "Grace",
      customerPhone: "555-3333",
      items: [{ menuItemId: "fake", quantity: 1 }],
    });
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe("INVALID_QR");
  });
});
