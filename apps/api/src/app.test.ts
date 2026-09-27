import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const app = createApp();

describe("GET /api/v1/health", () => {
  it("responds with service status", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });
});

describe("error handling", () => {
  it("returns a consistent error shape for unknown routes", async () => {
    const res = await request(app).get("/api/v1/definitely-not-a-route");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found." },
    });
  });
});
