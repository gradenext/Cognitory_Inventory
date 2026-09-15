import mongoose from "mongoose";
import blogImageSchema from "./blogImageSchema.js";

const blogCategorySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    slug: { type: String, trim: true, required: true, unique: true },
    description: { type: String, trim: true, default: "" },
    featuredImage: { type: blogImageSchema, default: () => ({}) },
    order: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

blogCategorySchema.index({ deletedAt: 1, order: 1 });

export default mongoose.model("BlogCategory", blogCategorySchema);
