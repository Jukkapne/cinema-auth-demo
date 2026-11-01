import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp({ sessionSecret: "test-secret-with-enough-length" });

test("an anonymous user receives 401 from an authenticated route", async () => {
  const response = await request(app).get("/api/my-purchases");
  assert.equal(response.status, 401);
});

test("a customer cannot access the owner route", async () => {
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email: "customer@cinema.test", password: "demo1234" }).expect(200);
  await agent.get("/api/owner/report").expect(403);
});

test("an owner can access the owner route", async () => {
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email: "owner@cinema.test", password: "demo1234" }).expect(200);
  const response = await agent.get("/api/owner/report").expect(200);
  assert.equal(response.body.title, "Owner report");
});

test("guest checkout creates an anonymous session without authenticating the guest", async () => {
  const agent = request.agent(app);
  const purchase = await agent.post("/api/purchases").send({
    screeningId: 101,
    seats: ["C7"],
    guestEmail: "guest@example.com"
  }).expect(201);
  assert.equal(purchase.body.userId, null);
  assert.ok(purchase.body.guestId);
  const auth = await agent.get("/api/auth/me").expect(200);
  assert.equal(auth.body.user, null);
});
