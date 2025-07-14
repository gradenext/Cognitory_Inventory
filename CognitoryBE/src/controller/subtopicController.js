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
import { z } from "zod";
import { getPaginationMeta } from "../helper/getPaginationMeta.js";

export const createSubtopic = async (req, res) => {
  const session = await mongoose.startSession();
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

    const createdSubtopic = await session.withTransaction(async () => {
      await verifyModelReferences(refsToCheck, session);

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
        { session }
      );

      await Topic.findByIdAndUpdate(
        topicId,
        { $push: { subtopics: subtopic._id } },
        { session }
      );

      return await Subtopic.findById(subtopic._id)
        .populate("topic", "name slug email image subtopics _id")
        .session(session);
    });

    return handleSuccess(
      res,
      createdSubtopic,
      `Subtopic added successfully to Topic ${createdSubtopic?.topic?.name}`,
      201
    );
  } catch (err) {
    console.error("Create subtopic error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        "Subtopic with given name already exists in the topic",
        409
      );
    }
    return handleError(res, err, "Failed to create subtopic", 500);
  } finally {
    await session.endSession();
  }
};

export const getAllSubtopics = async (req, res) => {
  try {
    const {
      enterpriseId,
      classId,
      subjectId,
      topicId,
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
    if (topicId) {
      refsToCheck.push({ model: Topic, id: topicId, key: "Topic ID" });
      params.topic = topicId;
    }

    if (shouldFilterDeleted) {
      params.deletedAt = null;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await verifyModelReferences(refsToCheck);

    const query = Subtopic.find(params, "-slug -__v").populate([
      { path: "enterprise", select: "_id name" },
      { path: "class", select: "_id name" },
      { path: "subject", select: "_id name" },
      { path: "topic", select: "_id name" },
    ]);

    if (shouldPaginate) {
      query.skip(skip).limit(Number(limit));
    }

    const [subtopics, totalCount] = await Promise.all([
      query.exec(),
      Subtopic.countDocuments(params),
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
        subtopics,
      },
      "Subtopics fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch subtopics error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    return handleError(res, err, "Failed to fetch subtopics", 500);
  }
};

export const getSubtopicById = async (req, res) => {
  try {
    const { subtopicId } = req.params;
    const { showDeleted = "false" } = req.query;
    const role = req?.user?.role || "user";
    const isSuper = role === "super";
    const allowDeleted = showDeleted === "true";

    const refsToCheck = [{ id: subtopicId, key: "Subtopic ID" }];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    let filter = { _id: subtopicId };
    if (!isSuper && !allowDeleted) {
      filter.deletedAt = null;
    }

    const subtopic = await Subtopic.findOne(filter, "-slug -__v");
    if (!subtopic) {
      return handleError(res, {}, "Subtopic not found", 404);
    }

    return handleSuccess(res, subtopic, "Subtopic fetched successfully", 200);
  } catch (err) {
    console.error(err);
    return handleError(res, err, "Failed to fetch subtopic", 500);
  }
};

export const softUpdateSubtopicName = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { subtopicId } = req.params;
    const { name } = req.body;
    const { role } = req.user;

    // Step 1: Validate name
    const validationResult = validateWithZod(
      z.object({
        name: z.string().min(1, "Name is required"),
        subtopicId: z.string().min(1, "Subtopic ID is required"),
      }),
      { name, subtopicId }
    );
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    // Step 2: Validate Subtopic ID
    const invalidIds = isValidMongoId([
      { model: Subtopic, id: subtopicId, key: "Subtopic ID" },
    ]);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    // Step 3: Transaction
    const updatedSubtopic = await session.withTransaction(async () => {
      const existingSubtopic = await Subtopic.findById(subtopicId).session(
        session
      );
      if (!existingSubtopic) {
        throw new Error("Subtopic not found");
      }

      if (existingSubtopic.deletedAt && role !== "super") {
        throw new Error("Subtopic not found");
      }

      await Subtopic.findByIdAndUpdate(
        subtopicId,
        { name },
        { new: true, runValidators: true, session }
      );

      return await Subtopic.findById(subtopicId, "-__v")
        .populate("topic", "name slug email image subtopics _id")
        .session(session);
    });

    return handleSuccess(
      res,
      updatedSubtopic,
      "Subtopic name updated successfully",
      200
    );
  } catch (err) {
    console.error("Soft update subtopic name error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }

    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        "Another subtopic with this name already exists in the topic",
        409
      );
    }

    return handleError(res, err, "Failed to update subtopic name", 500);
  } finally {
    await session.endSession();
  }
};
