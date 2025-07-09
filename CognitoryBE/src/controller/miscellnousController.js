import Enterprise from "../models/Enterprise.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Subtopic from "../models/Subtopic.js";
import Level from "../models/Level.js";
import isValidMongoId from "../helper/isMongoId.js";
import handleError from "../helper/handleError.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import handleSuccess from "../helper/handleSuccess.js";

export const getFullCurriculum = async (req, res) => {
  try {
    const { enterpriseId, filterDeleted = "false" } = req.query;
    const shouldFilterDeleted = filterDeleted === "true";
    const deletedFilter = shouldFilterDeleted ? { deletedAt: null } : {};

    let enterpriseFilter = {};
    const refsToCheck = [];

    // If specific enterprise is passed, validate and filter
    if (enterpriseId) {
      refsToCheck.push({
        model: Enterprise,
        id: enterpriseId,
        key: "Enterprise ID",
      });

      const invalidIds = isValidMongoId(refsToCheck);
      if (invalidIds.length > 0) {
        return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
      }

      await verifyModelReferences(refsToCheck);

      enterpriseFilter = { _id: enterpriseId };
    }

    // Fetch enterprises (one or all)
    const enterprises = await Enterprise.find(
      { ...enterpriseFilter, ...deletedFilter },
      "_id name"
    );

    // If no enterprise found (in case of no match)
    if (!enterprises.length) {
      return handleSuccess(res, { curriculum: [] }, "No curriculum found", 200);
    }

    const enterpriseIds = enterprises.map((e) => e._id);

    // Fetch all curriculum models in parallel
    const [classes, subjects, topics, subtopics, levels] = await Promise.all([
      Class.find(
        { enterprise: { $in: enterpriseIds }, ...deletedFilter },
        "_id name enterprise"
      ),
      Subject.find(
        { enterprise: { $in: enterpriseIds }, ...deletedFilter },
        "_id name class enterprise"
      ),
      Topic.find(
        { enterprise: { $in: enterpriseIds }, ...deletedFilter },
        "_id name subject enterprise"
      ),
      Subtopic.find(
        { enterprise: { $in: enterpriseIds }, ...deletedFilter },
        "_id name topic enterprise"
      ),
      Level.find(
        { enterprise: { $in: enterpriseIds }, ...deletedFilter },
        "_id name subtopic enterprise"
      ),
    ]);

    // Build lookup maps by parent ID
    const levelMap = {};
    const subtopicMap = {};
    const topicMap = {};
    const subjectMap = {};
    const classMap = {};

    // Group levels by subtopic
    levels.forEach((lvl) => {
      const key = lvl.subtopic.toString();
      if (!levelMap[key]) levelMap[key] = [];
      levelMap[key].push(lvl.toObject());
    });

    // Group subtopics by topic and attach levels
    subtopics.forEach((subt) => {
      const key = subt.topic.toString();
      if (!subtopicMap[key]) subtopicMap[key] = [];
      const obj = subt.toObject();
      obj.levels = levelMap[subt._id.toString()] || [];
      subtopicMap[key].push(obj);
    });

    // Group topics by subject and attach subtopics
    topics.forEach((top) => {
      const key = top.subject.toString();
      if (!topicMap[key]) topicMap[key] = [];
      const obj = top.toObject();
      obj.subtopics = subtopicMap[top._id.toString()] || [];
      topicMap[key].push(obj);
    });

    // Group subjects by class and attach topics
    subjects.forEach((subj) => {
      const key = subj.class.toString();
      if (!subjectMap[key]) subjectMap[key] = [];
      const obj = subj.toObject();
      obj.topics = topicMap[subj._id.toString()] || [];
      subjectMap[key].push(obj);
    });

    // Group classes by enterprise and attach subjects
    classes.forEach((cls) => {
      const key = cls.enterprise.toString();
      if (!classMap[key]) classMap[key] = [];
      const obj = cls.toObject();
      obj.subjects = subjectMap[cls._id.toString()] || [];
      classMap[key].push(obj);
    });

    // Build final curriculum per enterprise
    const curriculum = enterprises.map((ent) => {
      return {
        _id: ent._id,
        name: ent.name,
        classes: classMap[ent._id.toString()] || [],
      };
    });

    return handleSuccess(
      res,
      { curriculum },
      "Full curriculum fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch full curriculum error:", err);
    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    return handleError(res, err, "Failed to fetch curriculum", 500);
  }
};
