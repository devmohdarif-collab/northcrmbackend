import "dotenv/config";
import { ChatOpenRouter } from "@langchain/openrouter";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is required. Add it to backend/.env.");
}

export const model = new ChatOpenRouter({
  model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENROUTER_API_KEY
});
