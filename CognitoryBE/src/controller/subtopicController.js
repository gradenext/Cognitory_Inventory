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
      const missing = await verifyModelReferences(refsToCheck, session);
      if (missing.length > 0) {
        return handleError(res, {}, `${missing.join(", ")} not found`, 404);
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

    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        `Subtopic with given name already exists in the topic`,
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

    const missing = await verifyModelReferences(refsToCheck);
    if (missing.length > 0) {
      return handleError(res, {}, `${missing.join(", ")} not found`, 404);
    }

    const query = Subtopic.find(params, "-slug -__v");

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
        ...(shouldPaginate && {
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount / Number(limit)),
        }),
        total: totalCount,
        subtopics,
      },
      "Subtopics fetched successfully",
      200
    );
  } catch (err) {
    console.error(err);
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
