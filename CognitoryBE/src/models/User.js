import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,

      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    image: {
      type: String,
      trim: true,
      default: "https://api.dicebear.com/9.x/shapes/svg",
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin","super"],
      default: "user",
    },
    approved: {
      type: Boolean,
      default: false,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });

export default mongoose.model("User", userSchema);
