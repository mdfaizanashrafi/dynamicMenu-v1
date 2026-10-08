import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/app.js";
import { THEME_PRESETS } from "../src/modules/themes/themes.presets.js";
import { authHeader, createStubVerifier } from "./helpers.js";

const app = createApp(createStubVerifier());

const FESTIVE = THEME_PRESETS.find((p) => p.key === "festive")!;
const MIDNIGHT = THEME_PRESETS.find((p) => p.key === "midnight-luxury")!;

async function seedOwner() {
  const user = await prisma.user.create({
    data: { clerkId: "clerk_owner", email: "owner@test.com" },
  });
  const restaurant = await prisma.restaurant.create({
    data: { name: "Theme House", slug: "theme-house" },
  });
  await prisma.restaurantMembership.create({
    data: { userId: user.id, restaurantId: restaurant.id, role: "OWNER" },
  });
  return { user, restaurant };
}

const asOwner = () => authHeader("clerk_owner");

describe("theme system (integration)", () => {
  let restaurantId = "";

  beforeEach(async () => {
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

  const themeUrl = (path = "") =>
    `/api/v1/restaurants/${restaurantId}/theme${path}`;

  it("returns preset defaults when no theme was saved", async () => {
    const res = await request(app).get(themeUrl()).set(asOwner());
    expect(res.status).toBe(200);
    expect(res.body.data.published).toBeNull();
    expect(res.body.data.draft.preset).toBe("modern-minimal");
    expect(res.body.data.presets).toHaveLength(THEME_PRESETS.length);
    expect(
      res.body.data.presets.map((p: { key: string }) => p.key)
    ).toContain("midnight-luxury");
  });

  it("saves a draft, validates input and keeps published stable", async () => {
    const saved = await request(app)
      .put(themeUrl())
      .set(asOwner())
      .send(FESTIVE.config);
    expect(saved.status).toBe(200);
    expect(saved.body.data.draft.preset).toBe("festive");
    expect(saved.body.data.published).toBeNull();

    const published = await request(app)
      .post(themeUrl("/publish"))
      .set(asOwner());
    expect(published.status).toBe(200);
    expect(published.body.data.published.preset).toBe("festive");
    expect(published.body.data.publishedAt).toBeTruthy();

    // Edit the draft afterwards; the published theme must not change.
    const edited = await request(app)
      .put(themeUrl())
      .set(asOwner())
      .send(MIDNIGHT.config);
    expect(edited.status).toBe(200);
    expect(edited.body.data.draft.preset).toBe("midnight-luxury");
    expect(edited.body.data.published.preset).toBe("festive");
  });

  it("rejects invalid theme configs", async () => {
    const badHex = await request(app)
      .put(themeUrl())
      .set(asOwner())
      .send({ ...FESTIVE.config, colors: { ...FESTIVE.config.colors, primary: "red" } });
    expect(badHex.status).toBe(400);

    const badEnum = await request(app)
      .put(themeUrl())
      .set(asOwner())
      .send({ ...FESTIVE.config, cardStyle: "wobbly" });
    expect(badEnum.status).toBe(400);

    const badUrl = await request(app)
      .put(themeUrl())
      .set(asOwner())
      .send({ ...FESTIVE.config, coverImageUrl: "not-a-url" });
    expect(badUrl.status).toBe(400);
  });

  it("never modifies menu data when themes change", async () => {
    // Build and publish a menu.
    const menu = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus`)
      .set(asOwner())
      .send({ name: "Theme Test Menu" });
    const section = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus/${menu.body.data.id}/sections`)
      .set(asOwner())
      .send({ name: "Mains" });
    await request(app)
      .post(
        `/api/v1/restaurants/${restaurantId}/menus/${menu.body.data.id}/sections/${section.body.data.id}/items`
      )
      .set(asOwner())
      .send({ name: "Biryani", price: 280 });
    await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus/${menu.body.data.id}/publish`)
      .set(asOwner());

    const before = {
      menus: await prisma.menu.count(),
      sections: await prisma.menuSection.count(),
      items: await prisma.menuItem.count(),
      revisions: await prisma.menuRevision.count(),
    };
    const revisionBefore = await prisma.menuRevision.findFirstOrThrow();

    // Change and publish a theme.
    await request(app).put(themeUrl()).set(asOwner()).send(MIDNIGHT.config);
    await request(app).post(themeUrl("/publish")).set(asOwner());

    const after = {
      menus: await prisma.menu.count(),
      sections: await prisma.menuSection.count(),
      items: await prisma.menuItem.count(),
      revisions: await prisma.menuRevision.count(),
    };
    const revisionAfter = await prisma.menuRevision.findFirstOrThrow();
    expect(after).toEqual(before);
    expect(JSON.stringify(revisionAfter.snapshot)).toBe(
      JSON.stringify(revisionBefore.snapshot)
    );
  });

  it("serves a preview with draft theme and the published snapshot", async () => {
    // No published menu yet → menu is null.
    const empty = await request(app).get(themeUrl("/preview")).set(asOwner());
    expect(empty.status).toBe(200);
    expect(empty.body.data.menu).toBeNull();
    expect(empty.body.data.restaurant.name).toBe("Theme House");

    const menu = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus`)
      .set(asOwner())
      .send({ name: "Preview Menu" });
    const section = await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus/${menu.body.data.id}/sections`)
      .set(asOwner())
      .send({ name: "Starters" });
    await request(app)
      .post(
        `/api/v1/restaurants/${restaurantId}/menus/${menu.body.data.id}/sections/${section.body.data.id}/items`
      )
      .set(asOwner())
      .send({ name: "Paneer Tikka", price: 220 });
    await request(app)
      .post(`/api/v1/restaurants/${restaurantId}/menus/${menu.body.data.id}/publish`)
      .set(asOwner());

    await request(app).put(themeUrl()).set(asOwner()).send(FESTIVE.config);

    const preview = await request(app).get(themeUrl("/preview")).set(asOwner());
    expect(preview.status).toBe(200);
    expect(preview.body.data.theme.preset).toBe("festive");
    expect(preview.body.data.menu.sections).toHaveLength(1);
    expect(preview.body.data.menu.sections[0].items[0].name).toBe("Paneer Tikka");
  });

  it("enforces manager role and tenant boundaries", async () => {
    const staff = await prisma.user.create({
      data: { clerkId: "clerk_staff", email: "staff@test.com" },
    });
    await prisma.restaurantMembership.create({
      data: { userId: staff.id, restaurantId, role: "STAFF" },
    });
    const denied = await request(app).get(themeUrl()).set(authHeader("clerk_staff"));
    expect(denied.status).toBe(403);

    await prisma.user.create({
      data: { clerkId: "clerk_out", email: "out@test.com" },
    });
    const outsider = await request(app).get(themeUrl()).set(authHeader("clerk_out"));
    expect(outsider.status).toBe(404);

    const other = await prisma.restaurant.create({
      data: { name: "Other", slug: "other-theme" },
    });
    const crossTenant = await request(app)
      .put(`/api/v1/restaurants/${other.id}/theme`)
      .set(asOwner())
      .send(FESTIVE.config);
    expect(crossTenant.status).toBe(404);
  });
});
