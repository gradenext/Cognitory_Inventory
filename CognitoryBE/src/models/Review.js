import mongoose from "mongoose";

const approvalSchema = new mongoose.Schema(
  {
    editAllowed: {
      type: Boolean,
      default: false,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    comment: {
      type: String,
      default: "",
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Review", approvalSchema);
