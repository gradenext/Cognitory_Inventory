import mongoose from "mongoose";
import slugify from "slugify";

const enterpriseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
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
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

enterpriseSchema.pre("save", function (next) {
  const encodedName = encodeURIComponent(this.name?.trim() || "default");
  this.image = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedName}`;
  next();
});

enterpriseSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Enterprise", enterpriseSchema);
