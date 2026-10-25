import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createCrmTools } from "../src/services/tools.js";

let mongo;
let tools;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  tools = Object.fromEntries(createCrmTools().map((crmTool) => [crmTool.name, crmTool]));
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test("AI tools expose lead list, create, update, delete, and stats operations", async () => {
  const created = JSON.parse(await tools.create_lead.invoke({
    name: "AI Tool Lead",
    company: "Northstar",
    status: "New"
  }));
  assert.equal(created.name, "AI Tool Lead");

  const listed = JSON.parse(await tools.list_leads.invoke({ search: "AI Tool Lead" }));
  assert.equal(listed.pagination.total, 1);
  assert.equal(listed.data[0]._id, created._id);

  const updated = JSON.parse(await tools.update_lead.invoke({
    id: created._id,
    changes: { status: "Qualified", leadScore: 82 }
  }));
  assert.equal(updated.status, "Qualified");
  assert.equal(updated.leadScore, 82);

  const stats = JSON.parse(await tools.get_lead_stats.invoke({}));
  assert.equal(stats.total, 1);
  assert.equal(stats.byStatus.Qualified, 1);

  const deleted = JSON.parse(await tools.delete_lead.invoke({ id: created._id }));
  assert.deepEqual(deleted, { success: true, deletedId: created._id });

  const remaining = JSON.parse(await tools.list_leads.invoke({}));
  assert.equal(remaining.pagination.total, 0);
});

test("AI lead tools reject invalid and empty mutation inputs", async () => {
  await assert.rejects(tools.create_lead.invoke({ company: "Missing name" }));
  await assert.rejects(tools.update_lead.invoke({ id: "not-an-id", changes: {} }));
});
