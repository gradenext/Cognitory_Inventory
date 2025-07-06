import mongoose from "mongoose";
import slugify from "slugify";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    enterprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enterprise",
      required: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
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

// ✅ Partial index to enforce slug uniqueness under enterprise where deletedAt is null
classSchema.index(
  { slug: 1, enterprise: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

classSchema.pre("validate", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

function handleSlugInQueryMiddleware(next) {
  const update = this.getUpdate();
  const name = update?.name || update?.$set?.name;

  if (name) {
    const slug = slugify(name, { lower: true, strict: true });

    if (update?.$set) {
      this.getUpdate().$set.slug = slug;
    } else {
      this.getUpdate().slug = slug;
    }
  }

  next();
}

classSchema.pre("findOneAndUpdate", handleSlugInQueryMiddleware);
classSchema.pre("updateOne", handleSlugInQueryMiddleware);
classSchema.pre("updateMany", handleSlugInQueryMiddleware);

export default mongoose.model("Class", classSchema);
