import mongoose from "mongoose";
import slugify from "slugify";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
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
    topics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
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

// ✅ Enforce slug uniqueness within class, ignoring soft-deleted
subjectSchema.index(
  { slug: 1, class: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

// ✅ Generate slug on create and when name is modified
subjectSchema.pre("validate", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name.trim(), { lower: true, strict: true });
  }
  next();
});

// For update queries
function handleSubjectSlugQuery(next) {
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

subjectSchema.pre("findOneAndUpdate", handleSubjectSlugQuery);
subjectSchema.pre("updateOne", handleSubjectSlugQuery);
subjectSchema.pre("updateMany", handleSubjectSlugQuery);

export default mongoose.model("Subject", subjectSchema);
