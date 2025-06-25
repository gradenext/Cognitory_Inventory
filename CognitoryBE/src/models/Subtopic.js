import mongoose from "mongoose";

const subtopicSchema = new mongoose.Schema({
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
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true,
  },
});

export default mongoose.model("Subtopic", subtopicSchema);
