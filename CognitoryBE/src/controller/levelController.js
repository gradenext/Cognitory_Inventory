import mongoose from "mongoose";
import Class from "../models/Class.js";
import Enterprise from "../models/Enterprise.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Subtopic from "../models/Subtopic.js";
import Level from "../models/Level.js";
import { validateWithZod } from "../validations/validate.js";
import handleError from "../helper/handleError.js";
import isValidMongoId from "../helper/isMongoId.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import handleSuccess from "../helper/handleSuccess.js";
import { levelSchema } from "../validations/level.js";

export const createLevel = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      name,
      rank,
      enterpriseId,
      classId,
      subjectId,
      topicId,
      subtopicId,
    } = req.body;

    const validationResult = validateWithZod(levelSchema, {
      name,
      rank,
      enterpriseId,
      classId,
      subjectId,
      topicId,
      subtopicId,
    });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const refsToCheck = [
      { model: Enterprise, id: enterpriseId, key: "Enterprise ID" },
      { model: Class, id: classId, key: "Class ID" },
      { model: Subject, id: subjectId, key: "Subject ID" },
      { model: Topic, id: topicId, key: "Topic ID" },
      { model: Subtopic, id: subtopicId, key: "Subtopic ID" },
    ];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const level = await session.withTransaction(async () => {
      await verifyModelReferences(refsToCheck, session);

      const subtopic = await Subtopic.findById(subtopicId).session(session);
      const maxLevels = Number(process.env.MAX_LEVELS_PER_SUBTOPIC) || 5;

      if (subtopic?.levels?.length >= maxLevels) {
        throw new Error(`Maximum ${maxLevels} levels per subtopic allowed`);
      }

      const [level] = await Level.create(
        [
          {
            name,
            rank,
            enterprise: enterpriseId,
            class: classId,
            subject: subjectId,
            topic: topicId,
            subtopic: subtopicId,
          },
        ],
        { session }
      );

      await Subtopic.findByIdAndUpdate(
        subtopicId,
        { $push: { levels: level._id } },
        { session }
      );

      return await Level.findById(level._id)
        .populate("subtopic", "name slug email image levels _id")
        .session(session);
    });

    return handleSuccess(
      res,
      level,
      `Level added successfully to Subtopic ${level?.subtopic?.name} with id ${level?.subtopic?._id}`,
      201
    );
  } catch (err) {
    console.error("Create level error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    if (err.message?.includes("Maximum")) {
      return handleError(res, {}, err.message, 404);
    }
    if (err.name === "MongoServerError" && err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];

      let message = "Duplicate entry";

      if (duplicateField === "name") {
        message = "Level with given name already exists in the subtopic";
      } else if (duplicateField === "rank") {
        message = "Level with given rank already exists in the subtopic";
      }

      return handleError(res, {}, message, 409);
    }

    return handleError(res, err, "Failed to create level", 500);
  } finally {
    await session.endSession();
  }
};

export const getAllLevels = async (req, res) => {
  try {
    const {
      enterpriseId,
      classId,
      subjectId,
      topicId,
      subtopicId,
      page = 1,
      limit = 10,
      paginate = "false",
      filterDeleted = "false",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const shouldPaginate = paginate === "true";
    const shouldFilterDeleted = filterDeleted === "true";

    let refsToCheck = [];
    let params = {};

    if (enterpriseId) {
      refsToCheck.push({
        model: Enterprise,
        id: enterpriseId,
        key: "Enterprise ID",
      });
      params.enterprise = enterpriseId;
    }

    if (classId) {
      refsToCheck.push({ model: Class, id: classId, key: "Class ID" });
      params.class = classId;
    }
    if (subjectId) {
      refsToCheck.push({ model: Subject, id: subjectId, key: "Subject ID" });
      params.subject = subjectId;
    }
    if (topicId) {
      refsToCheck.push({ model: Topic, id: topicId, key: "Topic ID" });
      params.topic = topicId;
    }
    if (subtopicId) {
      refsToCheck.push({ model: Subtopic, id: subtopicId, key: "Subtopic ID" });
      params.subtopic = subtopicId;
    }

    if (shouldFilterDeleted) {
      params.deletedAt = null;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await verifyModelReferences(refsToCheck);

    const query = Level.find(params, "-slug -__v");

    if (shouldPaginate) {
      query.skip(skip).limit(Number(limit));
    }

    const [levels, totalCount] = await Promise.all([
      query.exec(),
      Level.countDocuments(params),
    ]);

    return handleSuccess(
      res,
      {
        ...(shouldPaginate && {
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount / Number(limit)),
        }),
        total: totalCount,
        levels,
      },
      "Levels fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch levels error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    return handleError(res, err, "Failed to fetch levels", 500);
  }
};

export const getLevelById = async (req, res) => {
  try {
    const { levelId } = req.params;
    const { showDeleted = "false" } = req.query;

    const role = req?.user?.role || "user";
    const isSuper = role === "super";
    const allowDeleted = showDeleted === "true";

    const refsToCheck = [{ id: levelId, key: "Level ID" }];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const filter = { _id: levelId };
    if (!isSuper && !allowDeleted) {
      filter.deletedAt = null;
    }

    const level = await Level.findOne(filter, "-slug -__v");

    if (!level) {
      return handleError(res, {}, "Level not found", 404);
    }

    return handleSuccess(res, level, "Level fetched successfully", 200);
  } catch (err) {
    console.error(err);
    return handleError(res, err, "Failed to fetch level", 500);
  }
};

export const updateLevel = async (req, res) => {
  try {
    const updated = await Level.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteLevel = async (req, res) => {
  try {
    await Level.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
