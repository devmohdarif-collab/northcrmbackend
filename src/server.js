import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT || 5001);
try {
  await connectDatabase();
  app.listen(port, () => console.log(`CRM API listening on port ${port}`));
} catch (error) {
  console.error("Unable to start CRM API:", error.message);
  process.exitCode = 1;
}
