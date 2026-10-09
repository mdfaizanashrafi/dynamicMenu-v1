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
    data: { name: "Table House", slug: "table-house" },
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
  return res.body.data as {
    id: string;
    label: string;
    qrToken: string;
    isActive: boolean;
    menuUrl: string;
  };
}

describe("tables & QR (integration)", () => {
  let restaurantId = "";

  beforeEach(async () => {
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

  const tablesUrl = (path = "") =>
    `/api/v1/restaurants/${restaurantId}/tables${path}`;

  it("creates tables with unique unguessable tokens and menu URLs", async () => {
    const a = await createTable(restaurantId, "Table 1");
    const b = await createTable(restaurantId, "Patio 2");

    expect(a.qrToken).toHaveLength(24);
    expect(a.qrToken).not.toBe(b.qrToken);
    expect(a.menuUrl).toBe(`http://localhost:5173/q/${a.qrToken}`);
    expect(b.label).toBe("Patio 2");

    // Tokens are globally unique in the database.
    const tokens = await prisma.restaurantTable.findMany({
      select: { qrToken: true },
    });
    expect(new Set(tokens.map((t) => t.qrToken)).size).toBe(tokens.length);

    const list = await request(app).get(tablesUrl()).set(asOwner());
    expect(list.body.data).toHaveLength(2);
  });

  it("renames, deactivates, reactivates and rotates tokens", async () => {
    const table = await createTable(restaurantId);

    const renamed = await request(app)
      .patch(tablesUrl(`/${table.id}`))
      .set(asOwner())
      .send({ label: "Window 4" });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data.label).toBe("Window 4");

    const rotated = await request(app)
      .patch(tablesUrl(`/${table.id}`))
      .set(asOwner())
      .send({ rotateToken: true });
    expect(rotated.status).toBe(200);
    expect(rotated.body.data.qrToken).not.toBe(table.qrToken);
    expect(rotated.body.data.menuUrl).toContain(
      rotated.body.data.qrToken
    );

    const deactivated = await request(app)
      .patch(tablesUrl(`/${table.id}`))
      .set(asOwner())
      .send({ isActive: false });
    expect(deactivated.body.data.isActive).toBe(false);
  });

  it("resolves QR tokens publicly to restaurant + table without ids", async () => {
    const table = await createTable(restaurantId, "Table 9");
    const res = await request(app).get(
      `/api/v1/public/qr/${table.qrToken}`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      restaurant: { name: "Table House", slug: "table-house", logoUrl: null },
      table: { label: "Table 9" },
    });
    // No internal ids leak into the public payload.
    expect(JSON.stringify(res.body.data)).not.toContain(table.id);
    expect(JSON.stringify(res.body.data)).not.toContain(restaurantId);
  });

  it("rejects invalid, rotated and deactivated QR codes helpfully", async () => {
    const unknown = await request(app).get("/api/v1/public/qr/nope");
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe("INVALID_QR");
    expect(unknown.body.error.message).toContain(
      "ask restaurant staff for a new QR code"
    );

    const rotated = await createTable(restaurantId);
    const oldToken = rotated.qrToken;
    await request(app)
      .patch(tablesUrl(`/${rotated.id}`))
      .set(asOwner())
      .send({ rotateToken: true });
    const stale = await request(app).get(`/api/v1/public/qr/${oldToken}`);
    expect(stale.status).toBe(404);
    expect(stale.body.error.code).toBe("INVALID_QR");

    const off = await createTable(restaurantId, "Table 3");
    await request(app)
      .patch(tablesUrl(`/${off.id}`))
      .set(asOwner())
      .send({ isActive: false });
    const inactive = await request(app).get(`/api/v1/public/qr/${off.qrToken}`);
    expect(inactive.status).toBe(404);

    const deleted = await createTable(restaurantId, "Table 4");
    await request(app).delete(tablesUrl(`/${deleted.id}`)).set(asOwner());
    const gone = await request(app).get(`/api/v1/public/qr/${deleted.qrToken}`);
    expect(gone.status).toBe(404);
  });

  it("keeps tables tenant-scoped on dashboard endpoints", async () => {
    const mine = await createTable(restaurantId);
    const other = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-tables" },
    });
    const foreign = await prisma.restaurantTable.create({
      data: { restaurantId: other.id, label: "Secret", qrToken: "x".repeat(24) },
    });

    // Other restaurant's tables are not listed here.
    const list = await request(app).get(tablesUrl()).set(asOwner());
    expect(
      list.body.data.map((t: { id: string }) => t.id)
    ).toEqual([mine.id]);

    // …and cannot be edited through this tenant's path.
    const crossPatch = await request(app)
      .patch(tablesUrl(`/${foreign.id}`))
      .set(asOwner())
      .send({ label: "Hijacked" });
    expect(crossPatch.status).toBe(404);
    const crossDelete = await request(app)
      .delete(tablesUrl(`/${foreign.id}`))
      .set(asOwner());
    expect(crossDelete.status).toBe(404);

    // The foreign table itself is untouched.
    const intact = await prisma.restaurantTable.findUnique({
      where: { id: foreign.id },
    });
    expect(intact?.label).toBe("Secret");

    // Public resolution of the foreign token works without leaking ids.
    const resolved = await request(app).get(
      `/api/v1/public/qr/${foreign.qrToken}`
    );
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.restaurant.slug).toBe("other-tables");
  });

  it("enforces manager role and membership on table endpoints", async () => {
    const staff = await prisma.user.create({
      data: { clerkId: "clerk_staff", email: "staff@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: staff.id, restaurantId, role: "STAFF" },
    });
    const denied = await request(app)
      .post(tablesUrl())
      .set(authHeader("clerk_staff"))
      .send({ label: "Table 1" });
    expect(denied.status).toBe(403);

    await prisma.user.create({
      data: { clerkId: "clerk_out", email: "out@test.com" },
    });
    const outsider = await request(app)
      .get(tablesUrl())
      .set(authHeader("clerk_out"));
    expect(outsider.status).toBe(404);

    // Public endpoint needs no credentials at all.
    const table = await createTable(restaurantId);
    const anon = await request(app).get(`/api/v1/public/qr/${table.qrToken}`);
    expect(anon.status).toBe(200);
  });
});
