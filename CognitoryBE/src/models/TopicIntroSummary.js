import mongoose from "mongoose";

const topicIntroSummarySchema = new mongoose.Schema(
  {
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
    topic_slug: { type: String, required: true, trim: true },
    subject_slug: { type: String, required: true, trim: true },
    grade: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    file: {
      url: { type: String, trim: true, default: "" },
      publicId: { type: String, trim: true, default: "" },
      fileType: {
        type: String,
        enum: ["pdf", "ppt", "pptx", "jpg", "jpeg", "png", "gif", "webp", ""],
        default: "",
      },
      originalName: { type: String, trim: true, default: "" },
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

topicIntroSummarySchema.index({ topic: 1, deletedAt: 1 });
topicIntroSummarySchema.index({ topic_slug: 1, subject_slug: 1, grade: 1, deletedAt: 1 });

export default mongoose.model("TopicIntroSummary", topicIntroSummarySchema);
