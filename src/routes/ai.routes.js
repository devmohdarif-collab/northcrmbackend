
import { Router } from "express";
import { chat } from "../controllers/ai.controller.js";

const router = Router();

// Mount your existing authentication middleware here if
// authentication is not already applied globally.
router.post("/chat", chat);

export default router;
