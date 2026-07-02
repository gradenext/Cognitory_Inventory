import mongoose from "mongoose";

const courseAssignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
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
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

courseAssignmentSchema.index({ course: 1 });
courseAssignmentSchema.index({ course: 1, order: 1 });
courseAssignmentSchema.index({ status: 1 });

export default mongoose.model("CourseAssignment", courseAssignmentSchema);
