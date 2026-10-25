import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { LEAD_STATUSES } from "../models/Lead.js";
import * as leadService from "./lead.service.js";

const leadFields = {
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().max(254).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  company: z.string().max(120).nullable().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.string().max(80).nullable().optional(),
  assignedTo: z.string().max(100).nullable().optional(),
  leadScore: z.number().min(0).max(100).optional(),
  lastContactedAt: z.string().refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Last contacted date must be a valid date."
  ).nullable().optional()
};

const createLeadSchema = z.object({
  ...leadFields,
  name: z.string().min(2).max(120)
}).strict();

const updateLeadSchema = z.object({
  id: z.string().min(1),
  changes: z.object(leadFields).strict().refine(
    (changes) => Object.keys(changes).length > 0,
    "At least one lead field must be provided."
  )
}).strict();

function createServiceTool({ name, description, schema, serviceName, mapInput, mapResult }) {
  const service = leadService[serviceName];
  if (typeof service !== "function") {
    throw new Error(`CRM integration missing: export ${serviceName} from lead.service.js`);
  }

  return tool(
    async (input) => {
      const result = await service(...mapInput(input));
      return JSON.stringify(mapResult ? mapResult(result, input) : result);
    },
    { name, description, schema }
  );
}

export function createCrmTools() {
  return [
    createServiceTool({
      name: "list_leads",
      description: "List or search CRM leads. Supports pagination, name/company search, status and owner filters, and sorting.",
      serviceName: "listLeads",
      schema: z.object({
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        search: z.string().max(120).optional(),
        status: z.enum(LEAD_STATUSES).optional(),
        assignedTo: z.string().max(100).optional(),
        sort: z.enum(["newest", "score"]).optional()
      }).strict(),
      mapInput: (query) => [query]
    }),
    createServiceTool({
      name: "create_lead",
      description: "Create a CRM lead when the user explicitly asks and provides the required name.",
      serviceName: "createLead",
      schema: createLeadSchema,
      mapInput: (lead) => [lead]
    }),
    createServiceTool({
      name: "update_lead",
      description: "Update fields on one existing CRM lead. Requires its exact ID and at least one field to change.",
      serviceName: "updateLead",
      schema: updateLeadSchema,
      mapInput: ({ id, changes }) => [id, changes]
    }),
    createServiceTool({
      name: "delete_lead",
      description: "Permanently delete one CRM lead. Only call when the user explicitly asks to delete that specific lead and its exact ID is known.",
      serviceName: "deleteLead",
      schema: z.object({ id: z.string().min(1) }).strict(),
      mapInput: ({ id }) => [id],
      mapResult: (_result, { id }) => ({ success: true, deletedId: id })
    }),
    createServiceTool({
      name: "get_lead_stats",
      description: "Get CRM lead totals, counts by status, five recent leads, and owner names.",
      serviceName: "getLeadStats",
      schema: z.object({}).strict(),
      mapInput: () => []
    })
  ];
}
