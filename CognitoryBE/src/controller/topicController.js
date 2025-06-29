import mongoose from "mongoose";
import Class from "../models/Class.js";
import Enterprise from "../models/Enterprise.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import { validateWithZod } from "../validations/validate.js";
import { topicSchema } from "../validations/topic.js";
import handleError from "../helper/handleError.js";
import isValidMongoId from "../helper/isMongoId.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import handleSuccess from "../helper/handleSuccess.js";

export const createTopic = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const { name, enterpriseId, classId, subjectId } = req.body;

    const validationResult = validateWithZod(topicSchema, {
      name,
      enterpriseId,
      classId,
      subjectId,
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
    ];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await session.startTransaction();
    transactionStarted = true;

    const notExistIds = await verifyModelReferences(session, refsToCheck);
    if (notExistIds.length > 0) {
      if (transactionStarted) await session.abortTransaction();
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const [topic] = await Topic.create(
      [{ name, enterprise: enterpriseId, class: classId, subject: subjectId }],
      {
        session,
      }
    );

    await Subject.findByIdAndUpdate(
      subjectId,
      {
        $push: {
          topics: topic._id,
        },
      },
      { session }
    );

    const populatedTopic = await Topic.findById(topic._id)
      .populate("subject", "name slug email image topics _id")
      .session(session);

    await session.commitTransaction();
    transactionStarted = false;

    return handleSuccess(
      res,
      populatedTopic,
      `Topic added successfully to subject ${populatedTopic?.subject?.name} `,
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
        `Topic with given name already exist in the subject `,
        409
      );
    } else {
      console.error("Create topic error:", err);
      return handleError(res, err, "Failed to create topic", 500);
    }
  } finally {
    await session.endSession();
  }
};

export const getAllTopics = async (req, res) => {
  try {
    const topics = await Topic.find()
      .populate("enterpriseId")
      .populate("classId")
      .populate("subjectId");
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate("enterpriseId")
      .populate("classId")
      .populate("subjectId");
    if (!topic) return res.status(404).json({ error: "Not found" });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(topic);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    await Topic.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
