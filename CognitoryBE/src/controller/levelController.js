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
  let transactionStarted = false;
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
      { model: Subtopic, id: subtopicId, key: "Sub Topic ID" },
    ];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    session.startTransaction();
    transactionStarted = true;

    const notExistIds = await verifyModelReferences(session, refsToCheck);
    if (notExistIds.length > 0) {
      await session.abortTransaction();
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const subtopic = await Subtopic.findById(subtopicId).session(session);

    if (subtopic?.levels?.length > process.env.MAX_LEVELS_PER_SUBTOPIC) {
      if (transactionStarted) {
        await session.abortTransaction();
      }

      return handleError(
        res,
        {},
        `Maximum ${process.env.MAX_LEVELS_PER_SUBTOPIC} per subtopic can exist`,
        404
      );
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
      {
        session,
      }
    );

    await Subtopic.findByIdAndUpdate(
      subtopicId,
      {
        $push: {
          levels: level._id,
        },
      },
      {
        session,
      }
    );

    const populatedLevel = await Level.findById(level._id)
      .populate("subtopic", "name slug email image levels _id")
      .session(session);

    await session.commitTransaction();

    transactionStarted = false;

    return handleSuccess(
      res,
      populatedLevel,
      `Subtopic added successfully to Topic ${populatedLevel?.subtopic?.name} `,
      201
    );
  } catch (err) {
    if (transactionStarted) {
      await session.abortTransaction();
    }

    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        `Level with given name or rank already exist in the subtopic `,
        409
      );
    } else {
      console.error("Create level error:", err);
      return handleError(res, err, "Failed to create level", 500);
    }
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
      paginate = "true",
    } = req.query;

    const skip = (page - 1) * limit;
    const shouldPaginate = paginate === "true";

    let refsToCheck = [];
    let params = {};

    if (enterpriseId) {
      refsToCheck.push({
        model: Enterprise,
        id: enterpriseId,
        key: "Enterprise ID",
      });

      params["enterprise"] = enterpriseId;
    }

    if (classId) {
      refsToCheck.push({
        model: Class,
        id: classId,
        key: "Class ID",
      });

      params["class"] = classId;
    }
    if (subjectId) {
      refsToCheck.push({
        model: Subject,
        id: subjectId,
        key: "Subject ID",
      });

      params["subject"] = subjectId;
    }
    if (topicId) {
      refsToCheck.push({
        model: Topic,
        id: topicId,
        key: "Topic ID",
      });

      params["topic"] = topicId;
    }
    if (subtopicId) {
      refsToCheck.push({
        model: Subtopic,
        id: subtopicId,
        key: "Sub Topic ID",
      });

      params["subtopic"] = subtopicId;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const notExistIds = await verifyModelReferences(refsToCheck);
    if (notExistIds.length > 0) {
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const query = Level.find(params, "-slug -__v");

    if (shouldPaginate) {
      query.skip(skip).limit(limit);
    }

    const levels = await query.exec();
    const totalCount = await Level.countDocuments(params);

    return handleSuccess(
      res,
      {
        ...(shouldPaginate && {
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount / limit),
        }),
        total: totalCount,
        levels,
      },
      "Levels fetched successfully",
      200
    );
  } catch (err) {
    console.log(err);
    return handleError(res, err, "Failed to fetch levels", 500);
  }
};

export const getLevelById = async (req, res) => {
  try {
    const { levelId } = req.params;

    const refsToCheck = [{ id: levelId, key: "Level ID" }];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }
    const level = await Level.findById(levelId, "-slug -__v");
    if (!level) return handleError(res, {}, "Level Not found", 404);
    return handleSuccess(res, level, "Level fetched successfully", 200);
  } catch (err) {
    console.log(err);
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
