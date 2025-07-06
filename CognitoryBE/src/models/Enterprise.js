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



enterpriseSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name.trim(), { lower: true, strict: true });
  }

  if (!this.image && this.name) {
    const encodedName = encodeURIComponent(this.name.trim());
    this.image = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedName}`;
  }

  next();
});

function handleSlugAndImageInQuery(next) {
  const update = this.getUpdate();

  // support for both direct update and $set
  const name = update?.name || (update?.$set && update.$set.name);

  if (name) {
    const trimmedName = name.trim();
    const slug = slugify(trimmedName, { lower: true, strict: true });
    const encodedName = encodeURIComponent(trimmedName);
    const image = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedName}`;

    if (update?.$set) {
      update.$set.slug = slug;
      update.$set.image = image;
    } else {
      update.slug = slug;
      update.image = image;
    }
  }

  next();
}

enterpriseSchema.pre("findOneAndUpdate", handleSlugAndImageInQuery);
enterpriseSchema.pre("updateOne", handleSlugAndImageInQuery);
enterpriseSchema.pre("updateMany", handleSlugAndImageInQuery);

export default mongoose.model("Enterprise", enterpriseSchema);
