import express from "express";
import cors from "cors";
import leadRoutes from "./routes/lead.routes.js";
import aiRoutes from "./routes/ai.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: "*" }));
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));
  app.use("/api/leads", leadRoutes);
  app.use("/api/ai", aiRoutes);
  return app;
}

export default createApp();
