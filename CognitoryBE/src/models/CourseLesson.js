import mongoose from "mongoose";

const courseLessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
    file: {
      url: { type: String, trim: true, default: "" },
      publicId: { type: String, trim: true, default: "" },
      fileType: {
        type: String,
        enum: ["pdf", "ppt", "pptx", ""],
        default: "",
      },
      originalName: { type: String, trim: true, default: "" },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

courseLessonSchema.index({ course: 1 });
courseLessonSchema.index({ module: 1 });
courseLessonSchema.index({ module: 1, order: 1 });

export default mongoose.model("CourseLesson", courseLessonSchema);
