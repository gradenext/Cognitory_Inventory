import Topic from "../models/Topic.js";
import TopicContent from "../models/TopicContent.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import isValidMongoId from "../helper/isMongoId.js";
import { uploadCourseFile } from "../utils/courseUpload.js";

// ─── List content for a topic ─────────────────────────────────────────────────
export const getTopicContents = async (req, res) => {
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
};

// ─── Create content item (no file yet) ───────────────────────────────────────
export const createTopicContent = async (req, res) => {
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

    // Extract grade number from class name (e.g. "Grade 3" → 3, or "3" → 3)
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

    return handleSuccess(res, content, "Content created successfully", 201);
  } catch (err) {
    console.error("createTopicContent error:", err);
    return handleError(res, err, "Failed to create topic content", 500);
  }
};

// ─── Update content item metadata ─────────────────────────────────────────────
export const updateTopicContent = async (req, res) => {
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

    await _syncTopicContents(topicId);
    return handleSuccess(res, content, "Content updated successfully");
  } catch (err) {
    console.error("updateTopicContent error:", err);
    return handleError(res, err, "Failed to update topic content", 500);
  }
};

// ─── Upload file for a content item ──────────────────────────────────────────
export const uploadTopicContentFile = async (req, res) => {
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
    const result = await uploadCourseFile(file.tempFilePath, publicId, folderPath, ext);

    content.file = {
      url: result.secure_url,
      publicId: result.public_id,
      fileType: ext,
      originalName: file.name,
    };
    await content.save();

    await _syncTopicContents(topicId);
    return handleSuccess(res, content, "File uploaded successfully");
  } catch (err) {
    console.error("uploadTopicContentFile error:", err);
    return handleError(res, err, "Failed to upload file", 500);
  }
};

// ─── Soft delete ──────────────────────────────────────────────────────────────
export const deleteTopicContent = async (req, res) => {
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

    await _syncTopicContents(topicId);
    return handleSuccess(res, {}, "Content deleted successfully");
  } catch (err) {
    console.error("deleteTopicContent error:", err);
    return handleError(res, err, "Failed to delete topic content", 500);
  }
};

// ─── Internal: push full content list for a topic to GradeNext ───────────────
async function _syncTopicContents(topicId) {
  const gradeNextUrl = process.env.GRADENEXT_API_URL;
  const syncSecret = process.env.GRADENEXT_SYNC_SECRET;
  if (!gradeNextUrl || !syncSecret) return;

  try {
    const contents = await TopicContent.find({ topic: topicId, deletedAt: null }).sort({ order: 1 }).lean();
    if (!contents.length) return;

    const { topic_slug, subject_slug, grade } = contents[0];
    const payload = {
      topic_slug,
      subject_slug,
      grade,
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
      headers: {
        "Content-Type": "application/json",
        "X-Sync-Secret": syncSecret,
      },
      body: JSON.stringify(payload),
    }).catch((err) => console.error("GradeNext topic-content sync failed (non-fatal):", err.message));
  } catch (err) {
    console.error("_syncTopicContents error:", err);
  }
}
