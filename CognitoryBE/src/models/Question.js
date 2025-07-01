import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
      required: true,
    },
    textType: {
      type: String,
      enum: ["text", "markdown", "latex"],
      required: true,
    },
    image: {
      uuid: {
        type: String,
        unique: true,
      },
      files: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    type: {
      type: String,
      enum: ["input", "multiple"],
      required: true,
    },
    options: {
      type: [String],
      minLength: 4,
      maxLength: 4,
    },
    answer: {
      type: String,
      trim: true,
      required: true,
    },
    hint: {
      type: String,
      trim: true,
      required: true,
    },
    explanation: {
      type: String,
      trim: true,
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
    enterprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enterprise",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    subtopic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subtopic",
      required: true,
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast retrieval by hierarchy and creator
questionSchema.index({ enterpriseId: 1 });
questionSchema.index({ classId: 1 });
questionSchema.index({ subjectId: 1 });
questionSchema.index({ topicId: 1 });
questionSchema.index({ subtopicId: 1 });
questionSchema.index({ levelId: 1 });
questionSchema.index({ creatorId: 1 });

questionSchema.index({
  enterpriseId: 1,
  classId: 1,
  subjectId: 1,
  topicId: 1,
  subtopicId: 1,
  levelId: 1,
});

export default mongoose.model("Question", questionSchema);
