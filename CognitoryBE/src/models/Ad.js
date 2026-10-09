import mongoose from "mongoose";

export const AD_TYPES = ["image", "video", "offer", "announcement"];
export const AD_STATUSES = ["draft", "published", "paused"];
export const AD_THEMES = ["violet", "blue", "rose", "emerald", "amber", "slate"];

const adSchema = new mongoose.Schema(
  {
    // Internal name — only shown in Cognitory
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: AD_TYPES, required: true },
    status: { type: String, enum: AD_STATUSES, default: "draft" },

    media: {
      url: { type: String, trim: true, default: "" },
      publicId: { type: String, trim: true, default: "" },
      kind: { type: String, enum: ["image", "video", ""], default: "" },
      originalName: { type: String, trim: true, default: "" },
    },

    // Text shown on the ad
    tag: { type: String, trim: true, default: "" },
    headline: { type: String, trim: true, default: "" },
    subtext: { type: String, trim: true, default: "" },
    // Big icon shown when the ad has no media, and up to 3 short selling points
    emoji: { type: String, trim: true, default: "" },
    highlights: { type: [String], default: [] },

    offer: {
      discountText: { type: String, trim: true, default: "" },
      couponCode: { type: String, trim: true, default: "" },
      validTill: { type: Date, default: null },
    },

    // url is an in-app path ("/courses") or a full http(s) link
    cta: {
      label: { type: String, trim: true, default: "" },
      url: { type: String, trim: true, default: "" },
    },

    // Background when the ad has no media
    theme: { type: String, enum: AD_THEMES, default: "violet" },

    order: { type: Number, default: 0 },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adSchema.index({ status: 1, deletedAt: 1, order: 1 });

export default mongoose.model("Ad", adSchema);
