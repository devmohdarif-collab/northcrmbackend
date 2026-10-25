import * as leadService from "../services/lead.service.js";

export async function getLeads(req, res, next) {

  try {
    res.json(await leadService.listLeads(req.query));
  } catch (error) {
    next(error);
  }
}

export async function createLead(req, res, next) {
  try {
    const lead = await leadService.createLead(req.body);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
}

export async function updateLead(req, res, next) {
  try {
    res.json({ success: true, data: await leadService.updateLead(req.params.id, req.body) });
  } catch (error) {
    next(error);
  }
}

export async function deleteLead(req, res, next) {
  try {
    await leadService.deleteLead(req.params.id);
    res.status(200).json({ success: true, message: "Lead deleted" });
  } catch (error) {
    next(error);
  }
}

export async function getLeadStats(req, res, next) {
  try {
    res.json({ success: true, data: await leadService.getLeadStats() });
  } catch (error) {
    next(error);
  }
}
