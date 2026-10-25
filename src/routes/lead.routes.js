import { Router } from "express";
import { createLead, deleteLead, getLeadStats, getLeads, updateLead } from "../controllers/lead.controller.js";

const router = Router();
router.get("/", getLeads);
router.get("/stats", getLeadStats);
router.post("/", createLead);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

export default router;
