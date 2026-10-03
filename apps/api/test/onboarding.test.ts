import { rmSync } from "node:fs";
import path from "node:path";
import { beforeEach, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Restaurant } from "@prisma/client";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/app.js";
import { computeOnboarding } from "../src/modules/restaurants/restaurants.service.js";
import { authHeader, createStubVerifier } from "./helpers.js";

const app = createApp(createStubVerifier());

// 1×1 transparent PNG.
const PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

const uploadDir = path.resolve("uploads");

async function seedTenant(role: "OWNER" | "STAFF" = "OWNER") {
  const user = await prisma.user.create({
    data: { clerkId: `clerk_${role.toLowerCase()}`, email: `${role}@test.com` },
  });
  const restaurant = await prisma.restaurant.create({
    data: { name: "Onboard Test", slug: `onboard-${role.toLowerCase()}` },
  });
  await prisma.restaurantMembership.create({
    data: { userId: user.id, restaurantId: restaurant.id, role },
  });
  return { user, restaurant };
}

describe("onboarding progress (unit)", () => {
  it("derives steps from profile fields", () => {
    const base = { name: "R" } as Restaurant;
    const empty = computeOnboarding(base);
    expect(empty.total).toBe(6);
    expect(empty.completedCount).toBe(1); // identity only
    expect(empty.steps.find((s) => s.key === "logo")?.completed).toBe(false);

    const full = computeOnboarding({
      ...base,
      cuisine: "North Indian",
      description: "Dum biryani house",
      phone: "+91 9999999999",
      addressLine1: "1 MG Road",
      city: "Bengaluru",
      logoUrl: "http://localhost:4000/uploads/logo.png",
      googleMapsUrl: "https://maps.app.goo.gl/abc",
    } as Restaurant);
    expect(full.completedCount).toBe(full.total);
  });
});

describe("restaurant onboarding (integration)", () => {
  beforeEach(async () => {
    await prisma.restaurantMembership.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(() => {
    // Uploaded logos from these tests are disposable.
    rmSync(uploadDir, { recursive: true, force: true });
  });

  it("returns full profile with onboarding progress", async () => {
    const { restaurant } = await seedTenant();

    const res = await request(app)
      .get(`/api/v1/restaurants/${restaurant.id}`)
      .set(authHeader("clerk_owner"));

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Onboard Test");
    expect(res.body.data.onboarding.total).toBe(6);
    expect(res.body.data.onboarding.completedCount).toBe(1);
    expect(res.body.data.onboarding.steps).toHaveLength(6);
  });

  it("updates the profile and reflects progress", async () => {
    const { restaurant } = await seedTenant();

    const res = await request(app)
      .patch(`/api/v1/restaurants/${restaurant.id}`)
      .set(authHeader("clerk_owner"))
      .send({
        cuisine: "Hyderabadi",
        description: "Authentic dum biryani",
        phone: "+91 9999999999",
        addressLine1: "12 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
        primaryColor: "#F97316",
        googleMapsUrl: "https://maps.app.goo.gl/review-us",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.cuisine).toBe("Hyderabadi");
    expect(res.body.data.primaryColor).toBe("#F97316");

    const detail = await request(app)
      .get(`/api/v1/restaurants/${restaurant.id}`)
      .set(authHeader("clerk_owner"));
    // All steps except logo are complete after this patch.
    expect(detail.body.data.onboarding.completedCount).toBe(5);
    expect(
      detail.body.data.onboarding.steps.find((s: { key: string }) => s.key === "maps")?.completed
    ).toBe(true);
  });

  it("rejects invalid profile input", async () => {
    const { restaurant } = await seedTenant();

    const cases = [
      { email: "not-an-email" },
      { googleMapsUrl: "not-a-url" },
      { primaryColor: "orange" },
      { slug: "Bad Slug!" },
    ];
    for (const body of cases) {
      const res = await request(app)
        .patch(`/api/v1/restaurants/${restaurant.id}`)
        .set(authHeader("clerk_owner"))
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }

    // Empty patch is rejected too.
    const empty = await request(app)
      .patch(`/api/v1/restaurants/${restaurant.id}`)
      .set(authHeader("clerk_owner"))
      .send({});
    expect(empty.status).toBe(400);
  });

  it("uploads a logo, persists its URL and serves the file", async () => {
    const { restaurant } = await seedTenant();

    const res = await request(app)
      .post(`/api/v1/restaurants/${restaurant.id}/logo`)
      .set(authHeader("clerk_owner"))
      .attach("file", PNG_BUFFER, {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.logoUrl).toMatch(/\/uploads\/[a-f0-9-]+\.png$/);

    const stored = await prisma.restaurant.findUnique({
      where: { id: restaurant.id },
    });
    expect(stored?.logoUrl).toBe(res.body.data.logoUrl);

    const detail = await request(app)
      .get(`/api/v1/restaurants/${restaurant.id}`)
      .set(authHeader("clerk_owner"));
    expect(detail.body.data.onboarding.steps.find((s: { key: string }) => s.key === "logo")?.completed).toBe(true);
  });

  it("rejects invalid logo uploads", async () => {
    const { restaurant } = await seedTenant();

    const wrongType = await request(app)
      .post(`/api/v1/restaurants/${restaurant.id}/logo`)
      .set(authHeader("clerk_owner"))
      .attach("file", Buffer.from("plain text"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });
    expect(wrongType.status).toBe(400);
    expect(wrongType.body.error.code).toBe("INVALID_FILE_TYPE");

    const tooLarge = await request(app)
      .post(`/api/v1/restaurants/${restaurant.id}/logo`)
      .set(authHeader("clerk_owner"))
      .attach("file", Buffer.alloc(2 * 1024 * 1024 + 1, 1), {
        filename: "big.png",
        contentType: "image/png",
      });
    expect(tooLarge.status).toBe(400);
    expect(tooLarge.body.error.code).toBe("FILE_TOO_LARGE");

    const missing = await request(app)
      .post(`/api/v1/restaurants/${restaurant.id}/logo`)
      .set(authHeader("clerk_owner"));
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe("FILE_REQUIRED");
  });

  it("enforces role and tenant boundaries on profile and logo", async () => {
    await seedTenant("OWNER");
    const staffCtx = await (async () => {
      const user = await prisma.user.create({
        data: { clerkId: "clerk_staff", email: "staff@test.com" },
      });
      const restaurant = await prisma.restaurant.findFirstOrThrow();
      await prisma.restaurantMembership.create({
        data: { userId: user.id, restaurantId: restaurant.id, role: "STAFF" },
      });
      return { user, restaurant };
    })();

    // STAFF can view the profile…
    const view = await request(app)
      .get(`/api/v1/restaurants/${staffCtx.restaurant.id}`)
      .set(authHeader("clerk_staff"));
    expect(view.status).toBe(200);

    // …but cannot edit settings or upload a logo.
    const edit = await request(app)
      .patch(`/api/v1/restaurants/${staffCtx.restaurant.id}`)
      .set(authHeader("clerk_staff"))
      .send({ cuisine: "X" });
    expect(edit.status).toBe(403);

    const logo = await request(app)
      .post(`/api/v1/restaurants/${staffCtx.restaurant.id}/logo`)
      .set(authHeader("clerk_staff"))
      .attach("file", PNG_BUFFER, {
        filename: "logo.png",
        contentType: "image/png",
      });
    expect(logo.status).toBe(403);

    // A user with no membership gets 404 on every endpoint.
    await prisma.user.create({
      data: { clerkId: "clerk_outsider", email: "out@test.com" },
    });
    const outsider = await request(app)
      .patch(`/api/v1/restaurants/${staffCtx.restaurant.id}`)
      .set(authHeader("clerk_outsider"))
      .send({ cuisine: "X" });
    expect(outsider.status).toBe(404);
    const outsiderLogo = await request(app)
      .post(`/api/v1/restaurants/${staffCtx.restaurant.id}/logo`)
      .set(authHeader("clerk_outsider"))
      .attach("file", PNG_BUFFER, {
        filename: "logo.png",
        contentType: "image/png",
      });
    expect(outsiderLogo.status).toBe(404);
  });
});
