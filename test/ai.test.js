import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

test("AI chat validates messages and requires a user ID", async () => {
  const emptyMessage = await request(app).post("/api/ai/chat").send({ message: " " });
  assert.equal(emptyMessage.status, 400);

  const longMessage = await request(app).post("/api/ai/chat").send({ message: "a".repeat(4001) });
  assert.equal(longMessage.status, 400);

  const missingUserId = await request(app).post("/api/ai/chat").send({ message: "Hello" });
  assert.equal(missingUserId.status, 401);
  assert.match(missingUserId.body.error.message, /Authentication is required/);
});
