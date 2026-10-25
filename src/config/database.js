import mongoose from "mongoose";

export async function connectDatabase(
  uri = process.env.MONGODB_URI || "mongodb://localhost:27017/test"
) {
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}
