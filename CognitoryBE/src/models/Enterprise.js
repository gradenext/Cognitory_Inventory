import mongoose from "mongoose";

const enterpriseSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

export default mongoose.model("Enterprise", enterpriseSchema);
