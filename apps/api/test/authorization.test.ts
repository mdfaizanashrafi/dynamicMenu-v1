import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "../src/lib/prisma.js";
import { roleAtLeast, hasPermission } from "../src/utils/roles.js";
import { createApp } from "../src/app.js";
import { authHeader, createStubVerifier } from "./helpers.js";

describe("role hierarchy", () => {
  it("orders roles by privilege", () => {
    expect(roleAtLeast("OWNER", "STAFF")).toBe(true);
    expect(roleAtLeast("ADMIN", "MANAGER")).toBe(true);
    expect(roleAtLeast("MANAGER", "MANAGER")).toBe(true);
    expect(roleAtLeast("STAFF", "MANAGER")).toBe(false);
    expect(roleAtLeast("MANAGER", "OWNER")).toBe(false);
  });

  it("maps permissions to minimum roles", () => {
    expect(hasPermission("STAFF", "orders:manage")).toBe(true);
    expect(hasPermission("STAFF", "menu:manage")).toBe(false);
    expect(hasPermission("MANAGER", "menu:manage")).toBe(true);
    expect(hasPermission("MANAGER", "restaurant:manage")).toBe(false);
    expect(hasPermission("ADMIN", "members:manage")).toBe(true);
    expect(hasPermission("OWNER", "restaurant:manage")).toBe(true);
  });
});

describe("membership authorization (integration)", () => {
  beforeEach(async () => {
    await prisma.restaurantMembership.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  });

  it("blocks cross-tenant reads and writes with 404", async () => {
    const app = createApp(createStubVerifier());

    const owner = await prisma.user.create({
      data: { clerkId: "clerk_a", email: "a@test.com", name: "A" },
    });
    const outsider = await prisma.user.create({
      data: { clerkId: "clerk_b", email: "b@test.com", name: "B" },
    });
    const restaurant = await prisma.restaurant.create({
      data: { name: "A's Place", slug: "as-place" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: owner.id, restaurantId: restaurant.id, role: "OWNER" },
    });

    // Cross-tenant write → 404 (existence not leaked)
    const patch = await request(app)
      .patch(`/api/v1/restaurants/${restaurant.id}`)
      .set(authHeader("clerk_b"))
      .send({ name: "Hacked" });
    expect(patch.status).toBe(404);

    // Cross-tenant read of members → 404
    const members = await request(app)
      .get(`/api/v1/restaurants/${restaurant.id}/members`)
      .set(authHeader("clerk_b"));
    expect(members.status).toBe(404);

    // Owner can read members
    const ok = await request(app)
      .get(`/api/v1/restaurants/${restaurant.id}/members`)
      .set(authHeader("clerk_a"));
    expect(ok.status).toBe(200);
    expect(ok.body.data).toHaveLength(1);

    expect(outsider.id).toBeTruthy();
  });

  it("enforces role checks with 403", async () => {
    const app = createApp(createStubVerifier());

    const owner = await prisma.user.create({
      data: { clerkId: "clerk_o", email: "o@test.com" },
    });
    const staff = await prisma.user.create({
      data: { clerkId: "clerk_s", email: "s@test.com" },
    });
    const restaurant = await prisma.restaurant.create({
      data: { name: "R", slug: "r1" },
    });
    await prisma.restaurantMembership.createMany({
      data: [
        { userId: owner.id, restaurantId: restaurant.id, role: "OWNER" },
        { userId: staff.id, restaurantId: restaurant.id, role: "STAFF" },
      ],
    });

    // STAFF cannot manage the restaurant (ADMIN required)
    const denied = await request(app)
      .patch(`/api/v1/restaurants/${restaurant.id}`)
      .set(authHeader("clerk_s"))
      .send({ name: "New name" });
    expect(denied.status).toBe(403);

    // MANAGER+ would pass; promote staff and retry
    await prisma.restaurantMembership.updateMany({
      where: { userId: staff.id, restaurantId: restaurant.id },
      data: { role: "MANAGER" },
    });
    const stillDenied = await request(app)
      .patch(`/api/v1/restaurants/${restaurant.id}`)
      .set(authHeader("clerk_s"))
      .send({ name: "New name" });
    expect(stillDenied.status).toBe(403);

    await prisma.restaurantMembership.updateMany({
      where: { userId: staff.id, restaurantId: restaurant.id },
      data: { role: "ADMIN" },
    });
    const allowed = await request(app)
      .patch(`/api/v1/restaurants/${restaurant.id}`)
      .set(authHeader("clerk_s"))
      .send({ name: "New name" });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.name).toBe("New name");
  });

  it("rejects unauthenticated requests with 401", async () => {
    const app = createApp(createStubVerifier());

    const me = await request(app).get("/api/v1/me");
    expect(me.status).toBe(401);
    expect(me.body.error.code).toBe("AUTH_REQUIRED");

    const restaurants = await request(app).get("/api/v1/restaurants");
    expect(restaurants.status).toBe(401);
  });
});
