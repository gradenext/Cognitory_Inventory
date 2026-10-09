import express from "express";
import { authMiddleware, isAdmin } from "../middleware/auth.js";
import Ad, { AD_TYPES, AD_THEMES } from "../models/Ad.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import isValidMongoId from "../helper/isMongoId.js";
import { uploadCourseFile } from "../utils/courseUpload.js";

const router = express.Router();

const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp"];
const VIDEO_TYPES = ["mp4"];
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 50;

const TEXT_LIMITS = { name: 120, tag: 24, headline: 80, subtext: 160, discountText: 24, couponCode: 30, ctaLabel: 24, ctaUrl: 500, emoji: 8, highlight: 40 };
const MAX_HIGHLIGHTS = 3;

const clean = (value, max) => String(value ?? "").trim().slice(0, max);

const parseDate = (value) => {
  if (value === null || value === "" || value === undefined) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const isValidCtaUrl = (url) => url === "" || /^\/(?!\/)/.test(url) || /^https?:\/\//i.test(url);

// Copies the editable fields from the request body onto the ad. Returns an error message or null.
const applyFields = (ad, body) => {
  if (body.name !== undefined) ad.name = clean(body.name, TEXT_LIMITS.name);
  if (body.type !== undefined) {
    if (!AD_TYPES.includes(body.type)) return "Invalid ad type";
    ad.type = body.type;
  }
  if (body.theme !== undefined) {
    if (!AD_THEMES.includes(body.theme)) return "Invalid theme";
    ad.theme = body.theme;
  }
  if (body.tag !== undefined) ad.tag = clean(body.tag, TEXT_LIMITS.tag);
  if (body.headline !== undefined) ad.headline = clean(body.headline, TEXT_LIMITS.headline);
  if (body.subtext !== undefined) ad.subtext = clean(body.subtext, TEXT_LIMITS.subtext);
  if (body.emoji !== undefined) ad.emoji = clean(body.emoji, TEXT_LIMITS.emoji);
  if (body.highlights !== undefined) {
    if (!Array.isArray(body.highlights)) return "Highlights must be a list";
    ad.highlights = body.highlights.map((h) => clean(h, TEXT_LIMITS.highlight)).filter(Boolean).slice(0, MAX_HIGHLIGHTS);
  }
  if (body.order !== undefined) ad.order = Number(body.order) || 0;

  if (body.offer !== undefined) {
    const validTill = parseDate(body.offer?.validTill);
    if (validTill === undefined) return "Invalid offer valid-till date";
    ad.offer = {
      discountText: clean(body.offer?.discountText, TEXT_LIMITS.discountText),
      couponCode: clean(body.offer?.couponCode, TEXT_LIMITS.couponCode),
      validTill,
    };
  }

  if (body.cta !== undefined) {
    const url = clean(body.cta?.url, TEXT_LIMITS.ctaUrl);
    const label = clean(body.cta?.label, TEXT_LIMITS.ctaLabel);
    if (!isValidCtaUrl(url)) return "Button link must start with / or http(s)://";
    if (label && !url) return "Add a link for the button";
    if (url && !label) return "Add a label for the button";
    ad.cta = { label, url };
  }

  for (const key of ["startAt", "endAt"]) {
    if (body[key] !== undefined) {
      const d = parseDate(body[key]);
      if (d === undefined) return `Invalid ${key === "startAt" ? "start" : "end"} date`;
      ad[key] = d;
    }
  }
  if (ad.startAt && ad.endAt && ad.endAt <= ad.startAt) return "End date must be after start date";

  if (!ad.name) return "Name is required";
  return null;
};

// What an ad needs before it can go live
const publishBlocker = (ad) => {
  if (ad.type === "image" && ad.media?.kind !== "image") return "Upload an image before publishing";
  if (ad.type === "video" && ad.media?.kind !== "video") return "Upload a video before publishing";
  if (ad.type === "offer" && !ad.offer?.discountText && !ad.headline) return "Add a discount text or headline before publishing";
  if (ad.type === "announcement" && !ad.headline) return "Add a headline before publishing";
  if (ad.endAt && ad.endAt <= new Date()) return "End date is already in the past";
  return null;
};

const findAd = async (req, res) => {
  const { adId } = req.params;
  const invalid = isValidMongoId([{ id: adId, key: "Ad ID" }]);
  if (invalid.length > 0) {
    handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    return null;
  }
  const ad = await Ad.findOne({ _id: adId, deletedAt: null });
  if (!ad) {
    handleError(res, {}, "Ad not found", 404);
    return null;
  }
  return ad;
};

// ── Public: active ads for the GradeNext dashboard ───────────────────────────

router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const ads = await Ad.find({
      status: "published",
      deletedAt: null,
      $and: [
        { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
        { $or: [{ endAt: null }, { endAt: { $gt: now } }] },
      ],
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const data = ads.map((ad) => ({
      id: ad._id.toString(),
      type: ad.type,
      media: { url: ad.media?.url || "", kind: ad.media?.kind || "" },
      tag: ad.tag,
      headline: ad.headline,
      subtext: ad.subtext,
      emoji: ad.emoji || "",
      highlights: ad.highlights || [],
      offer: {
        discountText: ad.offer?.discountText || "",
        couponCode: ad.offer?.couponCode || "",
        validTill: ad.offer?.validTill || null,
      },
      cta: { label: ad.cta?.label || "", url: ad.cta?.url || "" },
      theme: ad.theme,
    }));

    res.set("Cache-Control", "public, max-age=60");
    return handleSuccess(res, { total: data.length, ads: data }, "Active ads fetched successfully");
  } catch (err) {
    console.error("getActiveAds error:", err);
    return handleError(res, err, "Failed to fetch ads", 500);
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────

router.get("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    const filter = { deletedAt: null };
    if (["draft", "published", "paused"].includes(req.query.status)) filter.status = req.query.status;
    const ads = await Ad.find(filter).sort({ order: 1, createdAt: -1 });
    return handleSuccess(res, { total: ads.length, ads }, "Ads fetched successfully");
  } catch (err) {
    console.error("getAds error:", err);
    return handleError(res, err, "Failed to fetch ads", 500);
  }
});

router.post("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    if (!AD_TYPES.includes(req.body?.type)) return handleError(res, {}, "Ad type is required", 400);
    const ad = new Ad({ createdBy: req.user?.userId || null });
    const problem = applyFields(ad, req.body);
    if (problem) return handleError(res, {}, problem, 400);
    await ad.save();
    return handleSuccess(res, ad, "Ad draft created successfully", 201);
  } catch (err) {
    console.error("createAd error:", err);
    return handleError(res, err, "Failed to create ad", 500);
  }
});

router.patch("/:adId", authMiddleware, isAdmin, async (req, res) => {
  try {
    const ad = await findAd(req, res);
    if (!ad) return;
    const problem = applyFields(ad, req.body || {});
    if (problem) return handleError(res, {}, problem, 400);
    if (ad.status === "published") {
      const blocker = publishBlocker(ad);
      if (blocker) return handleError(res, {}, `${blocker} (or pause the ad first)`, 400);
    }
    await ad.save();
    return handleSuccess(res, ad, "Ad updated successfully");
  } catch (err) {
    console.error("updateAd error:", err);
    return handleError(res, err, "Failed to update ad", 500);
  }
});

router.post("/:adId/media", authMiddleware, isAdmin, async (req, res) => {
  try {
    const ad = await findAd(req, res);
    if (!ad) return;
    if (!req.files?.file) return handleError(res, {}, "No file provided", 400);

    const file = req.files.file;
    const ext = file.name.split(".").pop().toLowerCase();
    const kind = IMAGE_TYPES.includes(ext) ? "image" : VIDEO_TYPES.includes(ext) ? "video" : "";
    if (!kind) return handleError(res, {}, "Only images (JPG, PNG, GIF, WEBP) and MP4 videos are allowed", 400);
    if (ad.type === "video" && kind !== "video") return handleError(res, {}, "A video ad needs an MP4 file", 400);
    if (ad.type !== "video" && kind !== "image") return handleError(res, {}, "This ad type takes an image, not a video", 400);

    const maxMb = kind === "image" ? MAX_IMAGE_MB : MAX_VIDEO_MB;
    if (file.size > maxMb * 1024 * 1024) {
      return handleError(res, {}, `${kind === "image" ? "Image" : "Video"} must be under ${maxMb}MB`, 400);
    }

    const result = await uploadCourseFile(file.tempFilePath, `ad_${ad._id}_${Date.now()}`, "Cognitory/ads", ext);
    ad.media = { url: result.secure_url, publicId: result.public_id, kind, originalName: file.name };
    await ad.save();
    return handleSuccess(res, ad, "Media uploaded successfully");
  } catch (err) {
    console.error("uploadAdMedia error:", err);
    return handleError(res, err, "Failed to upload media", 500);
  }
});

router.delete("/:adId/media", authMiddleware, isAdmin, async (req, res) => {
  try {
    const ad = await findAd(req, res);
    if (!ad) return;
    if (ad.status === "published" && (ad.type === "image" || ad.type === "video")) {
      return handleError(res, {}, "Pause the ad before removing its media", 400);
    }
    ad.media = { url: "", publicId: "", kind: "", originalName: "" };
    await ad.save();
    return handleSuccess(res, ad, "Media removed successfully");
  } catch (err) {
    console.error("removeAdMedia error:", err);
    return handleError(res, err, "Failed to remove media", 500);
  }
});

router.patch("/:adId/publish", authMiddleware, isAdmin, async (req, res) => {
  try {
    const ad = await findAd(req, res);
    if (!ad) return;
    const blocker = publishBlocker(ad);
    if (blocker) return handleError(res, {}, blocker, 400);
    ad.status = "published";
    ad.publishedAt = new Date();
    await ad.save();
    return handleSuccess(res, ad, "Ad published successfully");
  } catch (err) {
    console.error("publishAd error:", err);
    return handleError(res, err, "Failed to publish ad", 500);
  }
});

router.patch("/:adId/pause", authMiddleware, isAdmin, async (req, res) => {
  try {
    const ad = await findAd(req, res);
    if (!ad) return;
    if (ad.status !== "published") return handleError(res, {}, "Only a published ad can be paused", 400);
    ad.status = "paused";
    await ad.save();
    return handleSuccess(res, ad, "Ad paused successfully");
  } catch (err) {
    console.error("pauseAd error:", err);
    return handleError(res, err, "Failed to pause ad", 500);
  }
});

router.delete("/:adId", authMiddleware, isAdmin, async (req, res) => {
  try {
    const ad = await findAd(req, res);
    if (!ad) return;
    ad.deletedAt = new Date();
    ad.status = "paused";
    await ad.save();
    return handleSuccess(res, {}, "Ad deleted successfully");
  } catch (err) {
    console.error("deleteAd error:", err);
    return handleError(res, err, "Failed to delete ad", 500);
  }
});

export default router;
