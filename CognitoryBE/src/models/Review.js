import mongoose from "mongoose";

const approvalSchema = new mongoose.Schema({
  approved: {
    type: Boolean,
    default: false,
  },
  comment: {
    type: String,
    default: "",
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
});

export default mongoose.model("Review", approvalSchema);
