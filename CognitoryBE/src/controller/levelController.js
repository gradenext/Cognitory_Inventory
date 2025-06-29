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
    const levels = await Level.find()
      .populate("enterpriseId")
      .populate("classId")
      .populate("subjectId")
      .populate("topicId")
      .populate("subtopicId");
    res.json(levels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLevelById = async (req, res) => {
  try {
    const level = await Level.findById(req.params.id).populate(
      "enterpriseId classId subjectId topicId subtopicId"
    );
    if (!level) return res.status(404).json({ error: "Not found" });
    res.json(level);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
