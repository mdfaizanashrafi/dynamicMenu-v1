import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/app.js";
import { createStubVerifier } from "./helpers.js";
import {
  normalizeGoogleMapsUrl,
  reviewRedirectUrl,
} from "../src/integrations/google-maps.js";

const app = createApp(createStubVerifier());

describe("google maps integration (unit)", () => {
  it("accepts google-owned https URLs", () => {
    expect(normalizeGoogleMapsUrl("https://maps.google.com/review-cafe")).toBe(
      "https://maps.google.com/review-cafe"
    );
    expect(normalizeGoogleMapsUrl("https://maps.app.goo.gl/abc123")).toBe(
      "https://maps.app.goo.gl/abc123"
    );
    expect(normalizeGoogleMapsUrl("https://www.google.com/maps/place/x")).not.toBeNull();
  });

  it("rejects non-google hosts, http, and malformed URLs (open-redirect guard)", () => {
    expect(normalizeGoogleMapsUrl("https://evil.example.com/phish")).toBeNull();
    expect(normalizeGoogleMapsUrl("https://google.com.evil.com/x")).toBeNull();
    expect(normalizeGoogleMapsUrl("http://maps.google.com/insecure")).toBeNull();
    expect(normalizeGoogleMapsUrl("not a url")).toBeNull();
    expect(normalizeGoogleMapsUrl(null)).toBeNull();
    expect(normalizeGoogleMapsUrl("")).toBeNull();
  });

  it("reviewRedirectUrl is redirect-only and never claims a posted review", () => {
    expect(reviewRedirectUrl("https://maps.google.com/x")).toBe(
      "https://maps.google.com/x"
    );
    expect(reviewRedirectUrl("https://attacker.example/")).toBeNull();
  });
});

describe("google maps integration (integration)", () => {
  let restaurantId = "";
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
    await prisma.restaurant.deleteMany({ where: { parentId: { not: null } } });
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { clerkId: "clerk_owner", email: "owner@test.com" },
    });
    const restaurant = await prisma.restaurant.create({
      data: { name: "Maps Cafe", slug: "maps-cafe" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: user.id, restaurantId: restaurant.id, role: "OWNER" },
    });
    restaurantId = restaurant.id;

    const table = await prisma.restaurantTable.create({
      data: { restaurantId, label: "T1", qrToken: "m".repeat(24) },
    });
    token = table.qrToken;
  });

  it("returns null redirect for a non-Google stored URL instead of open-redirecting", async () => {
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { googleMapsUrl: "https://evil.example.com/phish" },
    });
    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId: (await prisma.restaurantTable.findFirstOrThrow({ where: { restaurantId } })).id,
        customerName: "Guest",
        customerPhone: "111",
        subtotal: 100,
        total: 100,
        status: "PAID",
      },
    });
    await prisma.review.create({
      data: { orderId: order.id, restaurantId, rating: 5 },
    });

    const res = await request(app).post(
      `/api/v1/public/qr/${token}/orders/${order.id}/review/google`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.googleMapsUrl).toBeNull();
    expect(res.body.data.review.googleMapsOpenedAt).not.toBeNull();
  });

  it("still redirects to legitimate Google URLs", async () => {
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { googleMapsUrl: "https://maps.google.com/maps-cafe" },
    });
    const table = await prisma.restaurantTable.findFirstOrThrow({ where: { restaurantId } });
    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId: table.id,
        customerName: "Guest",
        customerPhone: "111",
        subtotal: 100,
        total: 100,
        status: "PAID",
      },
    });
    await prisma.review.create({
      data: { orderId: order.id, restaurantId, rating: 4 },
    });

    const res = await request(app).post(
      `/api/v1/public/qr/${token}/orders/${order.id}/review/google`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.googleMapsUrl).toBe("https://maps.google.com/maps-cafe");
  });
});
