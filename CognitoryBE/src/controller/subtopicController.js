import mongoose from "mongoose";
import Class from "../models/Class.js";
import Enterprise from "../models/Enterprise.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Subtopic from "../models/Subtopic.js";
import { validateWithZod } from "../validations/validate.js";
import handleError from "../helper/handleError.js";
import isValidMongoId from "../helper/isMongoId.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import handleSuccess from "../helper/handleSuccess.js";
import { subtopicSchema } from "../validations/subtopic.js";

export const createSubtopic = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;
  try {
    const { name, enterpriseId, classId, subjectId, topicId } = req.body;

    const validationResult = validateWithZod(subtopicSchema, {
      name,
      enterpriseId,
      classId,
      subjectId,
      topicId,
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
    ];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    session.startTransaction();
    transactionStarted = true;

    const notExistIds = await verifyModelReferences(session, refsToCheck);
    if (notExistIds.length > 0) {
      if (transactionStarted) {
        await session.abortTransaction();
      }
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const [subtopic] = await Subtopic.create(
      [
        {
          name,
          enterprise: enterpriseId,
          class: classId,
          subject: subjectId,
          topic: topicId,
        },
      ],
      {
        session,
      }
    );

    await Topic.findByIdAndUpdate(
      topicId,
      {
        $push: {
          subtopics: subtopic._id,
        },
      },
      {
        session,
      }
    );

    const populatedSubtopic = await Subtopic.findById(subtopic._id)
      .populate("topic", "name slug email image subtopics _id")
      .session(session);

    await session.commitTransaction();

    transactionStarted = false;

    return handleSuccess(
      res,
      populatedSubtopic,
      `Subtopic added successfully to Topic ${populatedSubtopic?.topic?.name} `,
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
        `Subtopic with given name already exist in the topic `,
        409
      );
    } else {
      console.error("Create subtopic error:", err);
      return handleError(res, err, "Failed to create subtopic", 500);
    }
  } finally {
    await session.endSession();
  }
};

export const getAllSubtopics = async (req, res) => {
  try {
    const subtopics = await Subtopic.find()
      .populate("enterpriseId")
      .populate("classId")
      .populate("subjectId")
      .populate("topicId");
    res.json(subtopics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubtopicById = async (req, res) => {
  try {
    const subtopic = await Subtopic.findById(req.params.id)
      .populate("enterpriseId")
      .populate("classId")
      .populate("subjectId")
      .populate("topicId");
    if (!subtopic) return res.status(404).json({ error: "Not found" });
    res.json(subtopic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSubtopic = async (req, res) => {
  try {
    const subtopic = await Subtopic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(subtopic);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteSubtopic = async (req, res) => {
  try {
    await Subtopic.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
