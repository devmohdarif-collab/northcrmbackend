import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import Lead from "../src/models/Lead.js";

let mongo;
const app = createApp();

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
beforeEach(async () => Lead.deleteMany({}));
after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test("health endpoint reports service status", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, { status: "ok" });
});

test("lead CRUD validates input and returns consistent responses", async () => {
  const invalid = await request(app).post("/api/leads").send({ status: "Bogus" });
  assert.equal(invalid.status, 400);
  assert.equal((await request(app).put("/api/leads/not-an-id").send({ status: "New" })).status, 400);

  const created = await request(app).post("/api/leads").send({
    name: "Jamie Example", email: "jamie@example.test", company: "Example Co", status: "Qualified", leadScore: 82
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.name, "Jamie Example");

  const id = created.body.data._id;
  const updated = await request(app).put(`/api/leads/${id}`).send({ status: "Contacted" });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.status, "Contacted");

  const deleted = await request(app).delete(`/api/leads/${id}`);
  assert.equal(deleted.status, 200);
  assert.equal((await request(app).get("/api/leads")).body.pagination.total, 0);
});

test("lead list supports safe search, filters, sorting, and pagination", async () => {
  await Lead.insertMany([
    { name: "Alex Rivera", company: "Acme North", status: "New", assignedTo: "Morgan", leadScore: 40 },
    { name: "Alex Stone", company: "Acme South", status: "Qualified", assignedTo: "Morgan", leadScore: 90 },
    { name: "Sam Lee", company: "Other", status: "Qualified", assignedTo: "Taylor", leadScore: 60 }
  ]);
  const response = await request(app).get("/api/leads?search=Acme&status=Qualified&assignedTo=Morgan&sort=score&limit=1");
  assert.equal(response.status, 200);
  assert.equal(response.body.pagination.total, 1);
  assert.equal(response.body.data[0].leadScore, 90);

  assert.equal((await request(app).get("/api/leads?limit=101")).status, 400);
  assert.equal((await request(app).get("/api/leads?status=%24ne")).status, 400);
  assert.equal((await request(app).get("/api/leads?unexpected=value")).status, 400);
});

test("stats are derived from stored leads", async () => {
  await Lead.create([{ name: "One", status: "New", assignedTo: "Morgan" }, { name: "Two", status: "Lost" }]);
  const response = await request(app).get("/api/leads/stats");
  assert.equal(response.status, 200);
  assert.equal(response.body.data.total, 2);
  assert.equal(response.body.data.byStatus.New, 1);
  assert.equal(response.body.data.recent.length, 2);
  assert.deepEqual(response.body.data.owners, ["Morgan"]);
});
