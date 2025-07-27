import mongoose from "mongoose";
import User from "../models/User.js";
import Question from "../models/Question.js";
import Review from "../models/Review.js";
import Enterprise from "../models/Enterprise.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Subtopic from "../models/Subtopic.js";
import Level from "../models/Level.js";
import { questionSchema } from "../validations/question.js";
import { validateWithZod } from "../validations/validate.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import isValidMongoId from "../helper/isMongoId.js";
import { getPaginationMeta } from "../helper/getPaginationMeta.js";

export const createQuestion = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      text,
      textType,
      images = [],
      imageUUID,
      type,
      options,
      answer,
      hint,
      explanation,
      enterpriseId,
      classId,
      subjectId,
      topicId,
      subtopicId,
      levelId,
    } = req.body;

    const validationResult = validateWithZod(questionSchema, {
      text,
      textType,
      images,
      imageUUID,
      type,
      options,
      answer,
      hint,
      explanation,
      enterpriseId,
      classId,
      subjectId,
      topicId,
      subtopicId,
      levelId,
    });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const { userId } = req.user;

    const refsToCheck = [
      { model: Enterprise, id: enterpriseId, key: "Enterprise ID" },
      { model: Class, id: classId, key: "Class ID" },
      { model: Subject, id: subjectId, key: "Subject ID" },
      { model: Topic, id: topicId, key: "Topic ID" },
      { model: Subtopic, id: subtopicId, key: "Subtopic ID" },
      { model: Level, id: levelId, key: "Level ID" },
      { model: User, id: userId, key: "User ID" },
    ];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const createdQuestion = await session.withTransaction(async () => {
      await verifyModelReferences(refsToCheck, session);

      const [question] = await Question.create(
        [
          {
            text,
            textType,
            image: { uuid: imageUUID, files: images },
            type,
            options,
            answer,
            hint,
            explanation,
            enterprise: enterpriseId,
            class: classId,
            subject: subjectId,
            topic: topicId,
            subtopic: subtopicId,
            level: levelId,
            creator: userId,
          },
        ],
        { session }
      );

      const [review] = await Review.create([{ question: question._id }], {
        session,
      });

      await User.findByIdAndUpdate(
        userId,
        { $push: { questions: question._id } },
        { session }
      );

      question.review = review._id;
      await question.save({ session });

      return await Question.findById(question._id)
        .populate([
          { path: "review", select: "-__v" },
          { path: "creator", select: "_id name" },
        ])
        .session(session);
    });

    return handleSuccess(
      res,
      createdQuestion,
      "Question created successfully",
      201
    );
  } catch (err) {
    console.error("Create question error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    return handleError(res, err, "Failed to create question", 500);
  } finally {
    await session.endSession();
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const {
      enterpriseId,
      classId,
      subjectId,
      topicId,
      subtopicId,
      levelId,
      reviewed,
      approved,
      filterDeleted = "true",
      sort = "createdAt:desc",
      page = 1,
      limit = 10,
      paginate = "false",
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
    if (levelId) {
      refsToCheck.push({ model: Level, id: levelId, key: "Level ID" });
      params.level = levelId;
    }

    const { userId, role } = req.user;
    if (userId && role === "user") {
      refsToCheck.push({ model: User, id: userId, key: "User ID" });
      params.creator = userId;
    }

    if (shouldFilterDeleted) {
      params.deletedAt = null;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await verifyModelReferences(refsToCheck);

    // Parse sort
    const [sortField, sortDirectionRaw] = sort.split(":");
    const sortOrder = sortDirectionRaw === "asc" ? 1 : -1;
    const sortOption = { [sortField || "createdAt"]: sortOrder };

    // Fetch all questions first
    let questions = await Question.find(params, "-__v")
      .sort(sortOption)
      .populate([
        { path: "enterprise", select: "_id name" },
        { path: "class", select: "_id name" },
        { path: "subject", select: "_id name" },
        { path: "topic", select: "_id name" },
        { path: "subtopic", select: "_id name" },
        { path: "level", select: "_id name rank" },
        { path: "creator", select: "_id name" },
        {
          path: "review",
          select: "-__v",
          populate: { path: "reviewedBy", select: "_id name" },
        },
      ])
      .exec();

    // Filter by review.reviewedAt AFTER population
    if (reviewed === "true") {
      questions = questions.filter(
        (q) => q.review && q.review.reviewedAt !== null && !q.review.reviewable
      );
    } else if (reviewed === "false") {
      questions = questions.filter(
        (q) => !q.review || q.review.reviewedAt === null || q.review.reviewable
      );
    }

    if (approved === "true") {
      questions = questions.filter(
        (q) =>
          q.review && q.review.reviewedAt !== null && q.review.approved === true
      );
    } else if (approved === "false") {
      questions = questions.filter(
        (q) =>
          !q.review ||
          q.review.reviewedAt === null ||
          q.review.approved === false
      );
    }

    const total = questions.length;

    // Apply pagination
    if (shouldPaginate) {
      questions = questions.slice(skip, skip + Number(limit));
    }

    return handleSuccess(
      res,
      {
        ...(shouldPaginate &&
          getPaginationMeta({ page, limit, totalItems: total })),
        total,
        questions,
      },
      "Questions fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch questions error:", err);
    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    return handleError(res, err, "Failed to fetch questions", 500);
  }
};

export const getQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { showDeleted = "false" } = req.query;
    const role = req?.user?.role || "user";
    const isSuper = role === "super";
    const allowDeleted = showDeleted === "true";

    const refsToCheck = [{ id: questionId, key: "Question ID" }];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    let filter = { _id: questionId };
    if (!isSuper && !allowDeleted) {
      filter.deletedAt = null;
    }

    const cls = await Question.findOne(filter, "-slug -__v").populate([
      { path: "enterprise", select: "_id name" },
      { path: "class", select: "_id name" },
      { path: "subject", select: "_id name" },
      { path: "topic", select: "_id name" },
      { path: "subtopic", select: "_id name" },
      { path: "level", select: "_id name rank" },
      { path: "creator", select: "_id name" },
      {
        path: "review",
        select: "-__v",
        populate: { path: "reviewedBy", select: "_id name" },
      },
    ]);
    if (!cls) {
      return handleError(res, {}, "Class not found", 404);
    }

    return handleSuccess(res, cls, "Class fetched successfully", 200);
  } catch (err) {
    console.error(err);
    return handleError(res, err, "Failed to fetch class", 500);
  }
};

export const getOneUnreviewedQuestion = async (req, res) => {
  try {
    const { enterpriseId } = req.query;

    let filter = { deletedAt: null };

    if (enterpriseId) {
      const invalidIds = isValidMongoId([
        { model: Enterprise, id: enterpriseId, key: "Enterprise ID" },
      ]);
      if (invalidIds.length > 0) {
        return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
      }

      const enterpriseExists = await Enterprise.exists({ _id: enterpriseId });
      if (!enterpriseExists) {
        return handleError(res, {}, "Enterprise not found", 404);
      }

      filter.enterprise = enterpriseId;
    }

    // Fetch the oldest unreviewed question
    const question = await Question.find(filter, "-__v")
      .populate([
        { path: "enterprise", select: "_id name" },
        { path: "class", select: "_id name" },
        { path: "subject", select: "_id name" },
        { path: "topic", select: "_id name" },
        { path: "subtopic", select: "_id name" },
        { path: "level", select: "_id name" },
        { path: "creator", select: "_id name" },
        {
          path: "review",
          select: "_id reviewedAt reviewedBy",
          populate: { path: "reviewedBy", select: "_id name" },
        },
      ])
      .sort({ createdAt: 1 })
      .exec();

    // Now filter unreviewed ones (review === null OR review.reviewedAt === null)
    const unreviewed = question.find((q) => !q.review || !q.review.reviewedAt);

    if (!unreviewed) {
      return handleError(res, {}, "No unreviewed question found", 404);
    }

    return handleSuccess(
      res,
      { question: unreviewed },
      "Unreviewed question fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch unreviewed question error:", err);
    return handleError(res, err, "Failed to fetch unreviewed question", 500);
  }
};

export const softDeleteQuestion = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { questionId } = req.params;

    const refsToCheck = [{ id: questionId, key: "Question ID" }];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const deletedQuestion = await session.withTransaction(async () => {
      const question = await Question.findOne(
        { _id: questionId, deletedAt: null },
        null,
        { session }
      );

      if (!question) {
        throw new Error("Question not found or already deleted");
      }

      question.deletedAt = new Date();
      await question.save({ session });

      return await Question.findById(questionId, "-slug -__v").session(session);
    });

    return handleSuccess(
      res,
      deletedQuestion,
      "Question soft deleted successfully",
      200
    );
  } catch (err) {
    console.error("Soft delete question error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }

    return handleError(res, err, "Failed to soft delete question", 500);
  } finally {
    await session.endSession();
  }
};

export const getGradeNextQuestions = async (req, res) => {
  try {
    let {
      class: classParam,
      subject,
      topic,
      subtopic,
      level,
      reviewed,
      approved,
      filterDeleted = "true",
      sort = "createdAt:desc",
      page = 1,
      limit = 10,
      paginate = "false",
      random = "false",
    } = req.query;

    const { enterprise } = req.params;

    const shouldPaginate = paginate === "true";
    const shouldFilterDeleted = filterDeleted === "true";
    const shouldRandomize = random === "true";

    // Helper to resolve a slug OR ID to _id
    const resolveId = async (model, label, value) => {
      if (!value) return null;
      const doc = await model.findOne({
        slug: value,
        ...(shouldFilterDeleted ? { deletedAt: null } : {}),
      });
      if (!doc) {
        throw new Error(`${label} with slug '${value}' not found`);
      }
      return doc._id.toString();
    };

    // Resolve all references
    const [enterpriseId, classId, subjectId, topicId, subtopicId, levelId] =
      await Promise.all([
        resolveId(Enterprise, "Enterprise", enterprise),
        resolveId(Class, "Class", classParam),
        resolveId(Subject, "Subject", subject),
        resolveId(Topic, "Topic", topic),
        resolveId(Subtopic, "Subtopic", subtopic),
        resolveId(Level, "Level", level),
      ]);

    console.log(enterpriseId, classId, subjectId, topicId, subtopicId, levelId);

    // Build refsToCheck and Mongo query
    const refsToCheck = [];
    const params = {};

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
    if (levelId) {
      refsToCheck.push({ model: Level, id: levelId, key: "Level ID" });
      params.level = levelId;
    }

    if (shouldFilterDeleted) {
      params.deletedAt = null;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await verifyModelReferences(refsToCheck);

    const [sortField, sortDirection] = sort.split(":");
    const sortOption = {
      [sortField || "createdAt"]: sortDirection === "asc" ? 1 : -1,
    };

    let questions;

    if (shouldRandomize) {
      // Random fetch via $sample (not supporting pagination)
      questions = await Question.aggregate([
        { $match: params },
        { $sample: { size: Number(limit) } },
      ]);

      // Re-populate via second query to support `.populate()`
      const questionIds = questions.map((q) => q._id);
      questions = await Question.find({ _id: { $in: questionIds } })
        .populate([
          { path: "enterprise", select: "_id name" },
          { path: "class", select: "_id name" },
          { path: "subject", select: "_id name" },
          { path: "topic", select: "_id name" },
          { path: "subtopic", select: "_id name" },
          { path: "level", select: "_id name rank" },
        ])
        .exec();
    } else {
      // Normal fetch with sorting and pagination
      questions = await Question.find(params, "-__v")
        .sort(sortOption)
        .populate([
          { path: "enterprise", select: "_id name slug" },
          { path: "class", select: "_id name slug" },
          { path: "subject", select: "_id name slug" },
          { path: "topic", select: "_id name slug" },
          { path: "subtopic", select: "_id name slug" },
          { path: "level", select: "_id name rank slug" },
        ])
        .exec();
    }

    // Filter after population
    if (reviewed === "true") {
      questions = questions.filter((q) => q.review?.reviewedAt);
    } else if (reviewed === "false") {
      questions = questions.filter((q) => !q.review?.reviewedAt);
    }

    if (approved === "true") {
      questions = questions.filter((q) => q.review?.approved === true);
    } else if (approved === "false") {
      questions = questions.filter((q) => q.review?.approved === false);
    }

    const total = questions.length;

    // Slice manually for pagination (only in normal mode)
    if (shouldPaginate && !shouldRandomize) {
      const skip = (Number(page) - 1) * Number(limit);
      questions = questions.slice(skip, skip + Number(limit));
    }

    const finalQuestion = questions?.map((question) => ({
      questionType: question?.textType,
      questionText: question?.text,
      options: question?.options,
      correctAnswer: question?.answer,
      hint: question?.hint,
      explanation: question?.explanation,
      images: question?.image?.files,
      enterprise: question?.enterprise,
      class: question?.class,
      subject: question?.subject,
      topic: question?.topic,
      subtopic: question?.subtopic,
      level: question?.level,
    }));

    return handleSuccess(
      res,
      {
        ...(shouldPaginate &&
          !shouldRandomize &&
          getPaginationMeta({ page, limit, totalItems: total })),
        total,
        questions: finalQuestion,
      },
      "Questions fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch questions error:", err);
    if (
      err.message?.includes("not found") ||
      err.message?.includes("with slug")
    ) {
      return handleError(res, {}, err.message, 404);
    }
    return handleError(res, err, "Failed to fetch questions", 500);
  }
};
