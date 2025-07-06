import mongoose from "mongoose";
import slugify from "slugify";

const levelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    rank: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
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
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Unique slug within subtopic, ignoring soft-deleted
levelSchema.index(
  { slug: 1, subtopic: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

// ✅ Unique rank within subtopic, ignoring soft-deleted
levelSchema.index(
  { rank: 1, subtopic: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

// ✅ Slug generation on create & name upda te
levelSchema.pre("validate", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name.trim(), { lower: true, strict: true });
  }
  next();
});

// For update queries
function handleLevelSlugQuery(next) {
  const update = this.getUpdate();
  const name = update?.name || update?.$set?.name;

  if (name) {
    const slug = slugify(name.trim(), { lower: true, strict: true });
    if (update?.$set) {
      update.$set.slug = slug;
    } else {
      update.slug = slug;
    }
  }

  next();
}

levelSchema.pre("findOneAndUpdate", handleLevelSlugQuery);
levelSchema.pre("updateOne", handleLevelSlugQuery);
levelSchema.pre("updateMany", handleLevelSlugQuery);

export default mongoose.model("Level", levelSchema);
