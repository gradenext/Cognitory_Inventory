import mongoose from "mongoose";
import blogImageSchema from "./blogImageSchema.js";
import { toSlug } from "../helper/blogSlug.js";

const faqItemSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, required: true },
    answer: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    slug: { type: String, trim: true, required: true, unique: true },
    // Slugs this post was published under before a rename; the website 301-redirects them.
    previousSlugs: { type: [String], default: [] },
    metaTitle: { type: String, trim: true, default: "" },
    metaDescription: { type: String, trim: true, default: "" },
    excerpt: { type: String, trim: true, default: "" },
    answerFirstSummary: { type: String, trim: true, default: "" },
    body: { type: String, default: "" },
    featuredImage: { type: blogImageSchema, default: () => ({}) },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "BlogAuthor", default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "BlogCategory", default: null },
    tags: { type: [String], default: [] },
    tagSlugs: { type: [String], default: [] },
    funnelStage: { type: String, enum: ["top", "middle", "bottom"], default: "top" },
    faq: { type: [faqItemSchema], default: [] },
    relatedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "BlogPost" }],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    datePublished: { type: Date, default: null },
    dateModified: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

blogPostSchema.index({ status: 1, deletedAt: 1, datePublished: -1 });
blogPostSchema.index({ category: 1, status: 1, deletedAt: 1 });
blogPostSchema.index({ author: 1, status: 1, deletedAt: 1 });
blogPostSchema.index({ tagSlugs: 1 });
blogPostSchema.index({ previousSlugs: 1 });

blogPostSchema.pre("validate", function (next) {
  const tags = [...new Set((this.tags || []).map((t) => String(t).trim()).filter(Boolean))];
  this.tags = tags;
  this.tagSlugs = [...new Set(tags.map(toSlug).filter(Boolean))];
  next();
});

export default mongoose.model("BlogPost", blogPostSchema);
