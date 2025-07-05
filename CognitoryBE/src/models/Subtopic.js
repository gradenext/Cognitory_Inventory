import mongoose from "mongoose";
import slugify from "slugify";

const subtopicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true }, // ❌ no unique here
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
    levels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Level",
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

// ✅ Unique slug per topic, ignoring soft-deleted docs
subtopicSchema.index(
  { slug: 1, topic: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

// ✅ Generate slug from name on create & update
subtopicSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Subtopic", subtopicSchema);
