import express from "express";
import {
  createTopic,
  getAllTopics,
  getTopicById,
  softUpdateTopicName,
} from "../controller/topicController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";
import Topic from "../models/Topic.js";
import TopicContent from "../models/TopicContent.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import isValidMongoId from "../helper/isMongoId.js";
import { uploadCourseFile } from "../utils/courseUpload.js";

const router = express.Router();

// ── Topic CRUD ────────────────────────────────────────────────────────────────
router.get("/", authMiddleware, getAllTopics);
router.post("/", authMiddleware, isAdmin, createTopic);

// ── Topic Content (must come before /:topicId to avoid param conflict) ────────

router.get("/:topicId/content", authMiddleware, async (req, res) => {
  try {
    const { topicId } = req.params;
    const invalid = isValidMongoId([{ id: topicId, key: "Topic ID" }]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const topic = await Topic.findOne({ _id: topicId, deletedAt: null });
    if (!topic) return handleError(res, {}, "Topic not found", 404);

    const contents = await TopicContent.find({ topic: topicId, deletedAt: null }).sort({ order: 1, createdAt: 1 });
    return handleSuccess(res, { total: contents.length, contents }, "Contents fetched successfully");
  } catch (err) {
    console.error("getTopicContents error:", err);
    return handleError(res, err, "Failed to fetch topic contents", 500);
  }
});

router.post("/:topicId/content", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { topicId } = req.params;
    const { title, description, order } = req.body;

    if (!title?.trim()) return handleError(res, {}, "Title is required", 400);

    const invalid = isValidMongoId([{ id: topicId, key: "Topic ID" }]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const topic = await Topic.findOne({ _id: topicId, deletedAt: null })
      .populate("class", "name")
      .populate("subject", "slug name");
    if (!topic) return handleError(res, {}, "Topic not found", 404);

    const classNameStr = topic.class?.name || "";
    const gradeMatch = classNameStr.match(/\d+/);
    if (!gradeMatch) return handleError(res, {}, "Could not resolve grade from topic's class", 400);
    const grade = parseInt(gradeMatch[0], 10);
    const subjectSlug = topic.subject?.slug || topic.subject?.name?.toLowerCase().replace(/\s+/g, "-") || "";

    const content = await TopicContent.create({
      topic: topicId,
      topic_slug: topic.slug,
      subject_slug: subjectSlug,
      grade,
      title: title.trim(),
      description: description?.trim() || "",
      order: order ? Number(order) : 0,
    });

    _syncTopicContents(topicId);
    return handleSuccess(res, content, "Content created successfully", 201);
  } catch (err) {
    console.error("createTopicContent error:", err);
    return handleError(res, err, "Failed to create topic content", 500);
  }
});

router.patch("/:topicId/content/:contentId", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { topicId, contentId } = req.params;
    const { title, description, order } = req.body;

    const invalid = isValidMongoId([
      { id: topicId, key: "Topic ID" },
      { id: contentId, key: "Content ID" },
    ]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const content = await TopicContent.findOne({ _id: contentId, topic: topicId, deletedAt: null });
    if (!content) return handleError(res, {}, "Content not found", 404);

    if (title !== undefined) content.title = title.trim();
    if (description !== undefined) content.description = description.trim();
    if (order !== undefined) content.order = Number(order);
    await content.save();

    _syncTopicContents(topicId);
    return handleSuccess(res, content, "Content updated successfully");
  } catch (err) {
    console.error("updateTopicContent error:", err);
    return handleError(res, err, "Failed to update topic content", 500);
  }
});

router.post("/:topicId/content/:contentId/upload", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { topicId, contentId } = req.params;

    const invalid = isValidMongoId([
      { id: topicId, key: "Topic ID" },
      { id: contentId, key: "Content ID" },
    ]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    if (!req.files?.file) return handleError(res, {}, "No file provided", 400);

    const content = await TopicContent.findOne({ _id: contentId, topic: topicId, deletedAt: null });
    if (!content) return handleError(res, {}, "Content not found", 404);

    const file = req.files.file;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "ppt", "pptx"].includes(ext)) {
      return handleError(res, {}, "Only PDF, PPT, and PPTX files are allowed", 400);
    }

    const folderPath = `Cognitory/topic-content/${content.subject_slug}/grade-${content.grade}/${content.topic_slug}`;
    const publicId = `content_${contentId}_${Date.now()}`;
    const result = await uploadCourseFile(file.tempFilePath, publicId, folderPath);

    content.file = {
      url: result.secure_url,
      publicId: result.public_id,
      fileType: ext,
      originalName: file.name,
    };
    await content.save();

    _syncTopicContents(topicId);
    return handleSuccess(res, content, "File uploaded successfully");
  } catch (err) {
    console.error("uploadTopicContentFile error:", err);
    return handleError(res, err, "Failed to upload file", 500);
  }
});

router.delete("/:topicId/content/:contentId", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { topicId, contentId } = req.params;

    const invalid = isValidMongoId([
      { id: topicId, key: "Topic ID" },
      { id: contentId, key: "Content ID" },
    ]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const content = await TopicContent.findOne({ _id: contentId, topic: topicId, deletedAt: null });
    if (!content) return handleError(res, {}, "Content not found", 404);

    content.deletedAt = new Date();
    await content.save();

    _syncTopicContents(topicId);
    return handleSuccess(res, {}, "Content deleted successfully");
  } catch (err) {
    console.error("deleteTopicContent error:", err);
    return handleError(res, err, "Failed to delete topic content", 500);
  }
});

// ── Curriculum active/inactive toggle ────────────────────────────────────────
router.patch("/:topicId/toggle-curriculum", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { topicId } = req.params;
    const invalid = isValidMongoId([{ id: topicId, key: "Topic ID" }]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const topic = await Topic.findOne({ _id: topicId, deletedAt: null })
      .populate("class", "name")
      .populate("subject", "slug name");

    if (!topic) return handleError(res, {}, "Topic not found", 404);

    // Flip the toggle
    topic.isActiveCurriculum = !topic.isActiveCurriculum;
    await topic.save();

    // Resolve grade number from class name (e.g. "Grade 4" → 4)
    const classNameStr = topic.class?.name || "";
    const gradeMatch = classNameStr.match(/\d+/);
    if (!gradeMatch) {
      return handleSuccess(res, { isActiveCurriculum: topic.isActiveCurriculum }, "Toggled (grade not resolvable, sync skipped)");
    }
    const grade = parseInt(gradeMatch[0], 10);
    const subject = topic.subject?.slug || "";

    if (!subject) {
      return handleSuccess(res, { isActiveCurriculum: topic.isActiveCurriculum }, "Toggled (subject not resolvable, sync skipped)");
    }

    // Query ALL topics for this class+subject directly — avoids Subject.topics array
    // which can miss topics created after the Subject document was first populated.
    const allTopicsRaw = await Topic.find({
      class: topic.class._id,
      subject: topic.subject._id,
      deletedAt: null,
    })
      .populate({ path: "subtopics", match: { deletedAt: null }, select: "name slug" })
      .sort({ createdAt: 1 });

    const allTopics = allTopicsRaw.map((t, idx) => ({
      cognitory_id: t._id.toString(),
      topic_key: t.slug,
      display_name: t.name,
      order: idx,
      is_active: t._id.toString() === topicId
        ? topic.isActiveCurriculum  // use fresh value for the toggled topic
        : t.isActiveCurriculum,
      subtopics: (t.subtopics || []).map((sub, si) => ({
        cognitory_id: sub._id.toString(),
        name: sub.name,
        order: si,
      })),
    }));

    _syncCurriculum(grade, subject, allTopics);

    return handleSuccess(res, { isActiveCurriculum: topic.isActiveCurriculum }, "Curriculum toggle updated and sync fired");
  } catch (err) {
    console.error("toggle-curriculum error:", err);
    return handleError(res, err, "Failed to toggle curriculum status", 500);
  }
});

// ── Single topic + update (after content routes to avoid param conflict) ───────
router.get("/:topicId", authMiddleware, getTopicById);
router.patch("/:topicId", authMiddleware, isAdmin, softUpdateTopicName);

// ── Internal sync helper ──────────────────────────────────────────────────────
async function _syncTopicContents(topicId) {
  const gradeNextUrl = process.env.GRADENEXT_API_URL;
  const syncSecret = process.env.GRADENEXT_SYNC_SECRET;
  if (!gradeNextUrl || !syncSecret) return;
  try {
    const contents = await TopicContent.find({ topic: topicId, deletedAt: null }).sort({ order: 1 }).lean();
    if (!contents.length) return;
    const { topic_slug, subject_slug, grade } = contents[0];
    const payload = {
      topic_slug, subject_slug, grade,
      contents: contents.map((c) => ({
        cognitory_id: c._id.toString(),
        title: c.title,
        description: c.description,
        order: c.order,
        file_url: c.file?.url || "",
        file_type: c.file?.fileType || "",
        original_filename: c.file?.originalName || "",
      })),
    };
    fetch(`${gradeNextUrl}/api/topic-content/sync/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sync-Secret": syncSecret },
      body: JSON.stringify(payload),
    }).catch((err) => console.error("GradeNext sync failed:", err.message));
  } catch (err) {
    console.error("_syncTopicContents error:", err);
  }
}

// ── Curriculum sync helper ────────────────────────────────────────────────────
async function _syncCurriculum(grade, subject, topics) {
  const gradeNextUrl = process.env.GRADENEXT_API_URL;
  const syncSecret = process.env.GRADENEXT_SYNC_SECRET;
  if (!gradeNextUrl || !syncSecret) {
    console.warn("_syncCurriculum: GRADENEXT_API_URL or GRADENEXT_SYNC_SECRET not set, skipping.");
    return;
  }
  try {
    fetch(`${gradeNextUrl}/api/curriculum/sync/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sync-Secret": syncSecret },
      body: JSON.stringify({ grade, subject, topics }),
    }).catch((err) => console.error("GradeNext curriculum sync failed:", err.message));
  } catch (err) {
    console.error("_syncCurriculum error:", err);
  }
}

export default router;
