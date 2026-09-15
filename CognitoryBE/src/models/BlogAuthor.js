import mongoose from "mongoose";
import blogImageSchema from "./blogImageSchema.js";

const blogAuthorSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    slug: { type: String, trim: true, required: true, unique: true },
    role: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    credentials: { type: String, trim: true, default: "" },
    photo: { type: blogImageSchema, default: () => ({}) },
    socialLinks: {
      linkedin: { type: String, trim: true, default: "" },
      x: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
    },
    order: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

blogAuthorSchema.index({ deletedAt: 1, order: 1 });

export default mongoose.model("BlogAuthor", blogAuthorSchema);
