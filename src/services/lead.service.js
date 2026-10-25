import mongoose from "mongoose";
import Lead, { LEAD_STATUSES } from "../models/Lead.js";

const writableFields = new Set([
  "name", "email", "phone", "company", "status", "source", "assignedTo", "leadScore", "lastContactedAt"
]);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function validateLeadInput(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("Request body must be a JSON object");
    error.statusCode = 400;
    throw error;
  }
  const keys = Object.keys(body);
  const unknown = keys.filter((key) => !writableFields.has(key));
  if (unknown.length) {
    const error = new Error(`Unsupported field: ${unknown[0]}`);
    error.statusCode = 400;
    throw error;
  }
  if (!partial && (typeof body.name !== "string" || !body.name.trim())) {
    const error = new Error("Name is required");
    error.statusCode = 400;
    throw error;
  }
  if (partial && keys.length === 0) {
    const error = new Error("At least one field is required");
    error.statusCode = 400;
    throw error;
  }
  if (body.status !== undefined && !LEAD_STATUSES.includes(body.status)) {
    const error = new Error(`Status must be one of: ${LEAD_STATUSES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
  if (body.leadScore !== undefined && (typeof body.leadScore !== "number" || !Number.isFinite(body.leadScore) || body.leadScore < 0 || body.leadScore > 100)) {
    const error = new Error("Lead score must be a number between 0 and 100");
    error.statusCode = 400;
    throw error;
  }
  if (body.lastContactedAt !== undefined && body.lastContactedAt !== null && Number.isNaN(Date.parse(body.lastContactedAt))) {
    const error = new Error("Last contacted date must be a valid date");
    error.statusCode = 400;
    throw error;
  }
  for (const field of ["name", "email", "phone", "company", "source", "assignedTo"]) {
    if (body[field] !== undefined && body[field] !== null && typeof body[field] !== "string") {
      const error = new Error(`${field} must be a string`);
      error.statusCode = 400;
      throw error;
    }
  }
  return Object.fromEntries(keys.map((key) => [key, body[key]]));
}

export async function listLeads(query) {
  const allowedQueryFields = new Set(["page", "limit", "search", "status", "assignedTo", "sort"]);
  const unsupportedQuery = Object.keys(query).find((key) => !allowedQueryFields.has(key));
  if (unsupportedQuery) {
    const error = new Error(`Unsupported query parameter: ${unsupportedQuery}`);
    error.statusCode = 400;
    throw error;
  }
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    const error = new Error("Page must be a positive integer and limit must be between 1 and 100");
    error.statusCode = 400;
    throw error;
  }
  const { search = "", status, assignedTo } = query;
  if (typeof search !== "string" || search.length > 120) {
    const error = new Error("Search must be a string of at most 120 characters");
    error.statusCode = 400;
    throw error;
  }
  if (status && !LEAD_STATUSES.includes(status)) {
    const error = new Error(`Status must be one of: ${LEAD_STATUSES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
  if (assignedTo !== undefined && (typeof assignedTo !== "string" || assignedTo.length > 100)) {
    const error = new Error("Assigned owner must be a string of at most 100 characters");
    error.statusCode = 400;
    throw error;
  }
  const sortMap = { newest: { createdAt: -1 }, score: { leadScore: -1, createdAt: -1 } };
  const sort = query.sort ?? "newest";
  if (!Object.hasOwn(sortMap, sort)) {
    const error = new Error("Sort must be either newest or score");
    error.statusCode = 400;
    throw error;
  }

  const filter = {};
  if (search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: pattern }, { company: pattern }];
  }
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;

  const [leads, total] = await Promise.all([
    Lead.find(filter).select("-__v").sort(sortMap[sort]).skip((page - 1) * limit).limit(limit).lean(),
    Lead.countDocuments(filter)
  ]);
  return { success: true, data: leads, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function createLead(body) {
  const input = validateLeadInput(body);
  const lead = await Lead.create(input);
  return lead.toObject();
}

export async function updateLead(id, body) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid lead ID");
    error.statusCode = 400;
    throw error;
  }
  const input = validateLeadInput(body, { partial: true });
  const lead = await Lead.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!lead) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }
  return lead.toObject();
}

export async function deleteLead(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid lead ID");
    error.statusCode = 400;
    throw error;
  }
  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }
}

export async function getLeadStats() {
  const [total, grouped, recent, owners] = await Promise.all([
    Lead.countDocuments(),
    Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Lead.find().select("name company status leadScore createdAt assignedTo").sort({ createdAt: -1 }).limit(5).lean(),
    Lead.distinct("assignedTo", { assignedTo: { $type: "string", $ne: "" } })
  ]);
  const byStatus = Object.fromEntries(LEAD_STATUSES.map((status) => [status, 0]));
  for (const item of grouped) byStatus[item._id] = item.count;
  return { total, byStatus, recent, owners: owners.sort((a, b) => a.localeCompare(b)) };
}
