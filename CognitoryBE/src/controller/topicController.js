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
import { z } from "zod";
import { getPaginationMeta } from "../helper/getPaginationMeta.js";

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
      await verifyModelReferences(refsToCheck, session);

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
    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        "Topic with given name already exists in the subject",
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
      paginate = "false",
      filterDeleted = "true",
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

    await verifyModelReferences(refsToCheck);

    const query = Topic.find(params, "-slug -__v").populate([
      { path: "enterprise", select: "_id name" },
      { path: "class", select: "_id name" },
      { path: "subject", select: "_id name" },
    ]);

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
        ...(shouldPaginate &&
          getPaginationMeta({
            page,
            limit,
            totalItems: totalCount,
          })),
        total: totalCount,
        topics,
      },
      "Topics fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch topics error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
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

export const softUpdateTopicName = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { topicId } = req.params;
    const { name } = req.body;
    const { role } = req.user;

    // Step 1: Validate name
    const validationResult = validateWithZod(
      z.object({
        name: z.string().min(1, "Name is required"),
        topicId: z.string().min(1, "Topic ID is required"),
      }),
      { name, topicId }
    );
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    // Step 2: Validate topic ID
    const invalidIds = isValidMongoId([
      { model: Topic, id: topicId, key: "Topic ID" },
    ]);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    // Step 3: Run transaction
    const updatedTopic = await session.withTransaction(async () => {
      const existingTopic = await Topic.findById(topicId).session(session);
      if (!existingTopic) {
        throw new Error("Topic not found");
      }

      if (existingTopic.deletedAt && role !== "super") {
        throw new Error("Topic not found");
      }

      await Topic.findByIdAndUpdate(
        topicId,
        { name },
        { new: true, runValidators: true, session }
      );

      return await Topic.findById(topicId, " -__v")
        .populate("subject", "name slug email image topics _id")
        .session(session);
    });

    return handleSuccess(
      res,
      updatedTopic,
      "Topic name updated successfully",
      200
    );
  } catch (err) {
    console.error("Soft update topic name error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }

    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        "Another topic with this name already exists in the subject",
        409
      );
    }

    return handleError(res, err, "Failed to update topic name", 500);
  } finally {
    await session.endSession();
  }
};
