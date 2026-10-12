import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createStubVerifier } from "./helpers.js";

const app = createApp(createStubVerifier());

describe("production hardening (integration)", () => {
  it("sets security headers on every response", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["content-security-policy"]).toBeTruthy();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["strict-transport-security"]).toBeTruthy();
  });

  it("returns the consistent error shape without internals", async () => {
    const notFound = await request(app).get("/api/v1/definitely-not-a-route");
    expect(notFound.status).toBe(404);
    expect(notFound.body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found." },
    });

    const badBody = await request(app)
      .post("/api/v1/public/qr/x/orders")
      .send({ items: "nope" });
    expect(badBody.status).toBe(400);
    expect(badBody.body.success).toBe(false);
    expect(badBody.body.error.code).toBe("VALIDATION_ERROR");
    expect(JSON.stringify(badBody.body)).not.toContain("zod");
    expect(JSON.stringify(badBody.body)).not.toContain("stack");
  });

  it("emits rate-limit headers on public write endpoints", async () => {
    const res = await request(app)
      .post("/api/v1/public/qr/some-token/orders")
      .send({ items: [] });
    expect(res.headers["ratelimit"]).toBeTruthy();
    expect(res.headers["ratelimit-policy"]).toBeTruthy();
  });

  it("rejects oversized JSON payloads", async () => {
    const big = { data: "x".repeat(2 * 1024 * 1024) };
    const res = await request(app)
      .post("/api/v1/public/qr/some-token/orders")
      .set("Content-Type", "application/json")
      .send(JSON.stringify(big));
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("rejects malformed JSON with a client error", async () => {
    const res = await request(app)
      .post("/api/v1/public/qr/some-token/orders")
      .set("Content-Type", "application/json")
      .send("{ not json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });

  it("rejects unauthenticated dashboard access", async () => {
    const res = await request(app).get("/api/v1/restaurants");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_REQUIRED");
  });
});
