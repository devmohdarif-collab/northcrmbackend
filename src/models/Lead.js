import mongoose from "mongoose";

export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Converted", "Lost"];

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [120, "Name cannot exceed 120 characters"]
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"]
    },
    phone: { type: String, trim: true, maxlength: [40, "Phone cannot exceed 40 characters"] },
    company: { type: String, trim: true, maxlength: [120, "Company cannot exceed 120 characters"] },
    status: { type: String, enum: LEAD_STATUSES, default: "New", required: true },
    source: { type: String, trim: true, maxlength: [80, "Source cannot exceed 80 characters"] },
    assignedTo: { type: String, trim: true, maxlength: [100, "Owner cannot exceed 100 characters"] },
    leadScore: { type: Number, min: 0, max: 100 },
    lastContactedAt: { type: Date }
  },
  { timestamps: true, versionKey: false }
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ leadScore: -1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ name: "text", company: "text" });

export default mongoose.model("Lead", leadSchema);
