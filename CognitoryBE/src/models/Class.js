import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Enterprise",
    required: true,
  },
});

export default mongoose.model("Class", classSchema);
