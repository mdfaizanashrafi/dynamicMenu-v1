import { rmSync } from "node:fs";
import path from "node:path";
import { beforeEach, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/app.js";
import { authHeader, createStubVerifier } from "./helpers.js";

const app = createApp(createStubVerifier());

const PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

async function seedOwner() {
  const user = await prisma.user.create({
    data: { clerkId: "clerk_owner", email: "owner@test.com" },
  });
  const restaurant = await prisma.restaurant.create({
    data: { name: "Menu House", slug: "menu-house" },
  });
  await prisma.restaurantMembership.create({
    data: { userId: user.id, restaurantId: restaurant.id, role: "OWNER" },
  });
  return { user, restaurant };
}

const asOwner = () => authHeader("clerk_owner");

async function createMenu(restaurantId: string, name = "Lunch Menu") {
  const res = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus`)
    .set(asOwner())
    .send({ name });
  expect(res.status).toBe(201);
  return res.body.data as { id: string };
}

async function createSection(restaurantId: string, menuId: string, name: string) {
  const res = await request(app)
    .post(`/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections`)
    .set(asOwner())
    .send({ name });
  expect(res.status).toBe(201);
  return res.body.data as { id: string };
}

async function createItem(
  restaurantId: string,
  menuId: string,
  sectionId: string,
  body: Record<string, unknown>
) {
  const res = await request(app)
    .post(
      `/api/v1/restaurants/${restaurantId}/menus/${menuId}/sections/${sectionId}/items`
    )
    .set(asOwner())
    .send(body);
  return res;
}

describe("menu management (integration)", () => {
  let restaurantId = "";

  beforeEach(async () => {
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

  afterAll(() => {
    rmSync(path.resolve("uploads"), { recursive: true, force: true });
  });

  it("creates, edits, activates and archives menus", async () => {
    const menu = await createMenu(restaurantId);

    const list = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus`)
      .set(asOwner());
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({
      name: "Lunch Menu",
      status: "DRAFT",
      itemCount: 0,
    });

    const patched = await request(app)
      .patch(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}`)
      .set(asOwner())
      .send({ name: "Dinner Menu", isActive: false });
    expect(patched.status).toBe(200);
    expect(patched.body.data.name).toBe("Dinner Menu");
    expect(patched.body.data.isActive).toBe(false);

    const archived = await request(app)
      .delete(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}`)
      .set(asOwner());
    expect(archived.status).toBe(200);

    const after = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus`)
      .set(asOwner());
    expect(after.body.data).toHaveLength(0);
  });

  it("manages sections: rename, hide, reorder, delete", async () => {
    const menu = await createMenu(restaurantId);
    const a = await createSection(restaurantId, menu.id, "Starters");
    const b = await createSection(restaurantId, menu.id, "Mains");
    const c = await createSection(restaurantId, menu.id, "Desserts");

    const renamed = await request(app)
      .patch(
        `/api/v1/restaurants/${restaurantId}/menus/${menu.id}/sections/${a.id}`
      )
      .set(asOwner())
      .send({ name: "Small Plates", isHidden: true });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data.name).toBe("Small Plates");
    expect(renamed.body.data.isHidden).toBe(true);

    const reordered = await request(app)
      .put(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}/sections/order`)
      .set(asOwner())
      .send({ sectionIds: [c.id, a.id, b.id] });
    expect(reordered.status).toBe(200);
    expect(reordered.body.data.map((s: { id: string }) => s.id)).toEqual([
      c.id,
      a.id,
      b.id,
    ]);

    const removed = await request(app)
      .delete(
        `/api/v1/restaurants/${restaurantId}/menus/${menu.id}/sections/${b.id}`
      )
      .set(asOwner());
    expect(removed.status).toBe(200);

    const detail = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}`)
      .set(asOwner());
    expect(detail.body.data.sections).toHaveLength(2);
  });

  it("creates items with variants and add-ons, edits and validates them", async () => {
    const menu = await createMenu(restaurantId);
    const section = await createSection(restaurantId, menu.id, "Mains");

    const created = await createItem(restaurantId, menu.id, section.id, {
      name: "Butter Chicken",
      description: "Creamy tomato gravy",
      price: 320,
      dietaryTags: ["NON_VEG", "SPICY"],
      variants: [
        { name: "Half", price: 220 },
        { name: "Full", price: 320 },
      ],
      addons: [{ name: "Extra Naan", price: 40 }],
    });
    expect(created.status).toBe(201);

    const detail = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}`)
      .set(asOwner());
    const item = detail.body.data.sections[0].items[0];
    expect(item).toMatchObject({
      name: "Butter Chicken",
      isAvailable: true,
      dietaryTags: ["NON_VEG", "SPICY"],
    });
    expect(item.variants).toHaveLength(2);
    expect(item.addons).toHaveLength(1);

    // Scalar edit + wholesale variant replacement.
    const updated = await request(app)
      .patch(
        `/api/v1/restaurants/${restaurantId}/menus/${menu.id}/sections/${section.id}/items/${item.id}`
      )
      .set(asOwner())
      .send({ isAvailable: false, variants: [{ name: "Family", price: 560 }] });
    expect(updated.status).toBe(200);
    expect(updated.body.data.isAvailable).toBe(false);

    const after = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}`)
      .set(asOwner());
    const edited = after.body.data.sections[0].items[0];
    expect(edited.isAvailable).toBe(false);
    expect(edited.variants).toHaveLength(1);
    expect(edited.variants[0].name).toBe("Family");
    expect(edited.addons).toHaveLength(1); // untouched

    // Validation: negative price and unknown dietary tag are rejected.
    const badPrice = await createItem(restaurantId, menu.id, section.id, {
      name: "X",
      price: -5,
    });
    expect(badPrice.status).toBe(400);
    const badTag = await createItem(restaurantId, menu.id, section.id, {
      name: "Y",
      price: 10,
      dietaryTags: ["ORGANIC"],
    });
    expect(badTag.status).toBe(400);

    const deleted = await request(app)
      .delete(
        `/api/v1/restaurants/${restaurantId}/menus/${menu.id}/sections/${section.id}/items/${item.id}`
      )
      .set(asOwner());
    expect(deleted.status).toBe(200);
  });

  it("uploads item images with type validation", async () => {
    const menu = await createMenu(restaurantId);
    const section = await createSection(restaurantId, menu.id, "Mains");
    const item = (await createItem(restaurantId, menu.id, section.id, { name: "Biryani", price: 280 }))
      .body.data;

    const uploaded = await request(app)
      .post(
        `/api/v1/restaurants/${restaurantId}/menus/${menu.id}/sections/${section.id}/items/${item.id}/image`
      )
      .set(asOwner())
      .attach("file", PNG_BUFFER, {
        filename: "biryani.png",
        contentType: "image/png",
      });
    expect(uploaded.status).toBe(200);
    expect(uploaded.body.data.imageUrl).toMatch(/\/uploads\/.+\.png$/);

    const rejected = await request(app)
      .post(
        `/api/v1/restaurants/${restaurantId}/menus/${menu.id}/sections/${section.id}/items/${item.id}/image`
      )
      .set(asOwner())
      .attach("file", Buffer.from("text"), {
        filename: "x.txt",
        contentType: "text/plain",
      });
    expect(rejected.status).toBe(400);
    expect(rejected.body.error.code).toBe("INVALID_FILE_TYPE");
  });

  it("blocks publishing an incomplete menu and publishes a complete one", async () => {
    const menu = await createMenu(restaurantId);

    const tooEarly = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}/publish`)
      .set(asOwner());
    expect(tooEarly.status).toBe(400);
    expect(tooEarly.body.error.code).toBe("MENU_INCOMPLETE");

    const section = await createSection(restaurantId, menu.id, "Must Try");
    await createItem(restaurantId, menu.id, section.id, {
      name: "Biryani",
      price: 280,
      variants: [{ name: "Large", price: 380 }],
    });

    const published = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}/publish`)
      .set(asOwner());
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe("PUBLISHED");
    expect(published.body.data.currentRevision).toMatchObject({
      sectionCount: 1,
      itemCount: 1,
    });
  });

  it("keeps draft edits invisible to the published snapshot", async () => {
    const menu = await createMenu(restaurantId);
    const section = await createSection(restaurantId, menu.id, "Must Try");
    await createItem(restaurantId, menu.id, section.id, { name: "Biryani", price: 280 });

    const first = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}/publish`)
      .set(asOwner());
    const firstRevisionId = first.body.data.currentRevision.id;

    // Edit the draft AFTER publishing: new item + renamed section.
    await createItem(restaurantId, menu.id, section.id, { name: "Butter Chicken", price: 320 });
    await request(app)
      .patch(
        `/api/v1/restaurants/${restaurantId}/menus/${menu.id}/sections/${section.id}`
      )
      .set(asOwner())
      .send({ name: "Renamed Draft Section" });

    // Draft tree reflects edits…
    const detail = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}`)
      .set(asOwner());
    expect(detail.body.data.sections[0].name).toBe("Renamed Draft Section");
    expect(detail.body.data.sections[0].items).toHaveLength(2);

    // …but the published snapshot is unchanged.
    const revisions = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}/revisions`)
      .set(asOwner());
    expect(revisions.body.data).toHaveLength(1);
    const revision = await prisma.menuRevision.findUnique({
      where: { id: firstRevisionId },
    });
    const snapshot = revision?.snapshot as {
      sections: { name: string; items: unknown[] }[];
    };
    expect(snapshot.sections[0]?.name).toBe("Must Try");
    expect(snapshot.sections[0]?.items).toHaveLength(1);

    // Republishing captures the draft as a new revision.
    const second = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}/publish`)
      .set(asOwner());
    expect(second.body.data.currentRevision.id).not.toBe(firstRevisionId);
    const history = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}/revisions`)
      .set(asOwner());
    expect(history.body.data).toHaveLength(2);

    // Unpublish takes it offline (DRAFT, no current revision).
    const unpublished = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}/unpublish`)
      .set(asOwner());
    expect(unpublished.body.data.status).toBe("DRAFT");
    expect(unpublished.body.data.currentRevisionId).toBeNull();
  });

  it("enforces manager role and tenant boundaries", async () => {
    const menu = await createMenu(restaurantId);
    const staff = await prisma.user.create({
      data: { clerkId: "clerk_staff", email: "staff@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: staff.id, restaurantId, role: "STAFF" },
    });

    // STAFF is below MANAGER for menu management.
    const denied = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus`)
      .set(authHeader("clerk_staff"));
    expect(denied.status).toBe(403);

    // Outsider gets 404 (existence not leaked).
    await prisma.user.create({
      data: { clerkId: "clerk_out", email: "out@test.com" },
    });
    const outsider = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus`)
      .set(authHeader("clerk_out"));
    expect(outsider.status).toBe(404);

    // Menu of another restaurant is unreachable under this tenant path.
    const other = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-place" },
    });
    const foreign = await request(app)
      .get(`/api/v1/restaurants/${restaurantId}/menus/${menu.id}`)
      .set(asOwner());
    expect(foreign.status).toBe(200);
    const crossTenant = await request(app)
      .get(`/api/v1/restaurants/${other.id}/menus/${menu.id}`)
      .set(asOwner());
    expect(crossTenant.status).toBe(404);
    const crossTenantSection = await request(app)
      .post(`/api/v1/restaurants/${other.id}/menus/${menu.id}/sections`)
      .set(asOwner())
      .send({ name: "Injected" });
    expect(crossTenantSection.status).toBe(404);
  });
});
