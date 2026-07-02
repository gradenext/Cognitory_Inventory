import mongoose from "mongoose";

const topicContentSchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    topic_slug: { type: String, required: true, trim: true },
    subject_slug: { type: String, required: true, trim: true },
    grade: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
    file: {
      url: { type: String, trim: true, default: "" },
      publicId: { type: String, trim: true, default: "" },
      fileType: { type: String, enum: ["pdf", "ppt", "pptx", ""], default: "" },
      originalName: { type: String, trim: true, default: "" },
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

topicContentSchema.index({ topic: 1, deletedAt: 1 });
topicContentSchema.index({ topic_slug: 1, subject_slug: 1, grade: 1, deletedAt: 1 });

export default mongoose.model("TopicContent", topicContentSchema);
