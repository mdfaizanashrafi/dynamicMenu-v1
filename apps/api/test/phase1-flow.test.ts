import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/app.js";
import { authHeader, createStubVerifier } from "./helpers.js";

const app = createApp(createStubVerifier());

describe("Phase 1 flow: signup → user → restaurant → membership", () => {
  beforeEach(async () => {
    await prisma.restaurantMembership.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  });

  it("syncs the Clerk identity into a local User on first request", async () => {
    const res = await request(app).get("/api/v1/me").set(authHeader("clerk_new"));

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("clerk_new@test.com");

    const user = await prisma.user.findUnique({
      where: { clerkId: "clerk_new" },
    });
    expect(user).not.toBeNull();
  });

  it("creates a restaurant with an OWNER membership", async () => {
    await request(app).get("/api/v1/me").set(authHeader("clerk_owner"));

    const res = await request(app)
      .post("/api/v1/restaurants")
      .set(authHeader("clerk_owner"))
      .send({ name: "Tandoor House", slug: "tandoor-house" });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe("tandoor-house");

    const membership = await prisma.restaurantMembership.findFirst({
      where: { restaurantId: res.body.data.id },
      include: { user: true },
    });
    expect(membership?.role).toBe("OWNER");
    expect(membership?.user.clerkId).toBe("clerk_owner");
  });

  it("lists only the caller's restaurants", async () => {
    await request(app).get("/api/v1/me").set(authHeader("clerk_a"));
    await request(app).get("/api/v1/me").set(authHeader("clerk_b"));
    const a = await request(app)
      .post("/api/v1/restaurants")
      .set(authHeader("clerk_a"))
      .send({ name: "A", slug: "a-rest" });
    await request(app)
      .post("/api/v1/restaurants")
      .set(authHeader("clerk_b"))
      .send({ name: "B", slug: "b-rest" });

    const list = await request(app)
      .get("/api/v1/restaurants")
      .set(authHeader("clerk_a"));

    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].restaurant.slug).toBe("a-rest");
    expect(a.status).toBe(201);
  });

  it("rejects invalid input with a validation error", async () => {
    await request(app).get("/api/v1/me").set(authHeader("clerk_v"));

    const badSlug = await request(app)
      .post("/api/v1/restaurants")
      .set(authHeader("clerk_v"))
      .send({ name: "X", slug: "Bad Slug!" });
    expect(badSlug.status).toBe(400);
    expect(badSlug.body.error.code).toBe("VALIDATION_ERROR");

    await request(app)
      .post("/api/v1/restaurants")
      .set(authHeader("clerk_v"))
      .send({ name: "X", slug: "taken" });
    const duplicate = await request(app)
      .post("/api/v1/restaurants")
      .set(authHeader("clerk_v"))
      .send({ name: "Y", slug: "taken" });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("SLUG_TAKEN");
  });

  it("handles unknown restaurant ids safely", async () => {
    await request(app).get("/api/v1/me").set(authHeader("clerk_z"));

    const res = await request(app)
      .patch("/api/v1/restaurants/nonexistent-id")
      .set(authHeader("clerk_z"))
      .send({ name: "X" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("RESTAURANT_NOT_FOUND");
  });
});
