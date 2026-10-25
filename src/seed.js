import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";
import Lead from "./models/Lead.js";

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const leads = [
  ["Avery Chen", "avery.chen@example.test", "Northstar Analytics", "Qualified", "Maya Patel", 91, "Website", 2],
  ["Jordan Blake", "jordan.blake@example.test", "Harbor & Pine", "Contacted", "Liam Brooks", 68, "Referral", 4],
  ["Riley Morgan", "riley.morgan@example.test", "BrightPath Health", "New", "Maya Patel", 54, "Conference", 1],
  ["Casey Rivera", "casey.rivera@example.test", "Atlas Creative Co.", "Converted", "Nora Williams", 96, "Partner", 9],
  ["Taylor Kim", "taylor.kim@example.test", "Juniper Financial", "Qualified", "Liam Brooks", 82, "Website", 6],
  ["Morgan Ellis", "morgan.ellis@example.test", "Cedarline Logistics", "Lost", "Nora Williams", 28, "Outbound", 18],
  ["Quinn Parker", "quinn.parker@example.test", "Lumen Learning", "New", "Maya Patel", 43, "Social", 3],
  ["Rowan Shah", "rowan.shah@example.test", "Peakstone Software", "Contacted", "Liam Brooks", 73, "Website", 7],
  ["Emerson Diaz", "emerson.diaz@example.test", "Willow & Reed", "Qualified", "Nora Williams", 87, "Referral", 12],
  ["Finley Ross", "finley.ross@example.test", "Bluebird Energy", "New", "Maya Patel", 61, "Conference", 5],
  ["Reese Turner", "reese.turner@example.test", "Meridian Supply", "Converted", "Liam Brooks", 99, "Partner", 15],
  ["Dakota James", "dakota.james@example.test", "Fieldnote Studios", "Contacted", "Nora Williams", 65, "Outbound", 11],
  ["Skyler Nguyen", "skyler.nguyen@example.test", "Evergreen Mobility", "Qualified", "Maya Patel", 78, "Website", 8],
  ["Peyton Brooks", "peyton.brooks@example.test", "Redwood Property Group", "Lost", "Liam Brooks", 32, "Social", 22],
  ["Alexis Foster", "alexis.foster@example.test", "Silverfern Media", "New", "Nora Williams", 47, "Referral", 13],
  ["Cameron Price", "cameron.price@example.test", "Cloudwell Systems", "Contacted", "Maya Patel", 71, "Website", 16],
  ["Sage Bennett", "sage.bennett@example.test", "Kindred Foods", "Qualified", "Liam Brooks", 89, "Conference", 20],
  ["Jamie Patel", "jamie.patel@example.test", "Cobalt Manufacturing", "New", "Nora Williams", 56, "Outbound", 24],
  ["Kendall Ward", "kendall.ward@example.test", "Orchard Veterinary", "Converted", "Maya Patel", 94, "Referral", 27],
  ["Harper Lewis", "harper.lewis@example.test", "Sundial Travel", "Contacted", "Liam Brooks", 63, "Social", 30]
].map(([name, email, company, status, assignedTo, leadScore, source, age]) => ({
  name, email, company, status, assignedTo, leadScore, source, createdAt: daysAgo(age), updatedAt: daysAgo(age)
}));

try {
  await connectDatabase();
  // This explicit seed command replaces the lead collection; it is never run during normal startup.
  await Lead.deleteMany({});
  await Lead.insertMany(leads);
  console.log(`Seeded ${leads.length} fictional leads (existing leads were cleared).`);
} catch (error) {
  console.error("Unable to seed leads:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
