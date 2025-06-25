import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Enterprise",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
});

export default mongoose.model("Subject", subjectSchema);
