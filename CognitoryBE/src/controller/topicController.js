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

    const createdTopic = await session.withTransaction(async () => {
      const notExistIds = await verifyModelReferences(refsToCheck, session);
      if (notExistIds.length > 0) {
        return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
      }

      const [topic] = await Topic.create(
        [
          {
            name,
            enterprise: enterpriseId,
            class: classId,
            subject: subjectId,
          },
        ],
        { session }
      );

      await Subject.findByIdAndUpdate(
        subjectId,
        { $push: { topics: topic._id } },
        { session }
      );

      return await Topic.findById(topic._id)
        .populate("subject", "name slug email image topics _id")
        .session(session);
    });

    return handleSuccess(
      res,
      createdTopic,
      `Topic added successfully to subject ${createdTopic?.subject?.name}`,
      201
    );
  } catch (err) {
    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        `Topic with given name already exists in the subject`,
        409
      );
    }

    console.error("Create topic error:", err);
    return handleError(res, err, "Failed to create topic", 500);
  } finally {
    await session.endSession();
  }
};

export const getAllTopics = async (req, res) => {
  try {
    const {
      enterpriseId,
      classId,
      subjectId,
      page = 1,
      limit = 10,
      paginate = "true",
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

    if (shouldFilterDeleted) {
      params.deletedAt = null;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const notExistIds = await verifyModelReferences(refsToCheck);
    if (notExistIds.length > 0) {
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const query = Topic.find(params, "-slug -__v");

    if (shouldPaginate) {
      query.skip(skip).limit(Number(limit));
    }

    const [topics, totalCount] = await Promise.all([
      query.exec(),
      Topic.countDocuments(params),
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
        topics,
      },
      "Topics fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch topics error:", err);
    return handleError(res, err, "Failed to fetch topics", 500);
  }
};

export const getTopicById = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { showDeleted = "false" } = req.query;
    const role = req?.user?.role || "user";
    const isSuper = role === "super";
    const allowDeleted = showDeleted === "true";

    const refsToCheck = [{ id: topicId, key: "Topic ID" }];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    let filter = { _id: topicId };
    if (!isSuper && !allowDeleted) {
      filter.deletedAt = null;
    }

    const topic = await Topic.findOne(filter, "-slug -__v");
    if (!topic) return handleError(res, {}, "Topic not found", 404);

    return handleSuccess(res, topic, "Topic fetched successfully", 200);
  } catch (err) {
    console.error("Fetch topic by ID error:", err);
    return handleError(res, err, "Failed to fetch topic", 500);
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
