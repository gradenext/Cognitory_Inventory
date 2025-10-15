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
import { editQuestionSchema, questionSchema } from "../validations/question.js";
import { validateWithZod } from "../validations/validate.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import isValidMongoId from "../helper/isMongoId.js";
import { getPaginationMeta } from "../helper/getPaginationMeta.js";
import { z } from "zod";

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

export const editQuestion = async (req, res) => {
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
    } = req.body;

    const { questionId } = req.params;
    const { userId, role } = req.user;

    // ------------------ Zod Validation ------------------
    const validationResult = validateWithZod(editQuestionSchema, {
      text,
      textType,
      images,
      imageUUID,
      type,
      options,
      answer,
      hint,
      explanation,
    });

    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    // ------------------ ID Validation ------------------
    const refsToCheck = [
      { model: Question, id: questionId, key: "Question ID" },
    ];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    // ------------------ Transaction ------------------
    const updatedQuestion = await session.withTransaction(async () => {
      // Verify the question exists (throws error if missing)
      await verifyModelReferences(refsToCheck, session);

      // Fetch the question for ownership and deletion checks
      const existingQuestion = await Question.findById(questionId)
        .select("creator deletedAt")
        .session(session);

      if (!existingQuestion) {
        return handleError(res, {}, "Question not found", 404);
      }

      // --------- Soft-delete Check ---------
      if (existingQuestion.deletedAt && role !== "super") {
        return handleError(res, {}, "Cannot edit a deleted question", 403);
      }

      // --------- Ownership Check ---------
      if (role === "user" && existingQuestion.creator.toString() !== userId) {
        return handleError(res, {}, "You can't edit this question", 403);
      }

      // --------- Update Operation ---------
      const updated = await Question.findByIdAndUpdate(
        questionId,
        {
          text,
          textType,
          image: { uuid: imageUUID, files: images },
          type,
          options,
          answer,
          hint,
          explanation,
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      ).select(
        "-__v -slug -creator -enterprise -class -subject -topic -subtopic -review"
      );

      if (!updated) {
        return handleError(res, {}, "Question not found", 404);
      }

      return updated;
    });

    // ------------------ Success Response ------------------
    if (!updatedQuestion) return;

    return handleSuccess(
      res,
      updatedQuestion,
      "Question updated successfully",
      200
    );
  } catch (err) {
    console.error("Edit question error:", err);

    if (err.code === 11000) {
      return handleError(res, {}, "Duplicate entry detected", 409);
    }

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }

    return handleError(res, err, "Failed to update question", 500);
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
      userId: queryUserId,
      filterDeleted = "true",
      sort = "createdAt:desc",
      page = 1,
      limit = 10,
      paginate = "false",
      image = "false",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const shouldPaginate = paginate === "true";
    const shouldFilterDeleted = filterDeleted === "true";
    const shouldFilterImage = image === "true";

    const refsToCheck = [];
    const matchFilter = {};

    if (enterpriseId) {
      refsToCheck.push({
        model: Enterprise,
        id: enterpriseId,
        key: "Enterprise ID",
      });
      matchFilter.enterprise = new mongoose.Types.ObjectId(enterpriseId);
    }
    if (classId) {
      refsToCheck.push({ model: Class, id: classId, key: "Class ID" });
      matchFilter.class = new mongoose.Types.ObjectId(classId);
    }
    if (subjectId) {
      refsToCheck.push({ model: Subject, id: subjectId, key: "Subject ID" });
      matchFilter.subject = new mongoose.Types.ObjectId(subjectId);
    }
    if (topicId) {
      refsToCheck.push({ model: Topic, id: topicId, key: "Topic ID" });
      matchFilter.topic = new mongoose.Types.ObjectId(topicId);
    }
    if (subtopicId) {
      refsToCheck.push({ model: Subtopic, id: subtopicId, key: "Subtopic ID" });
      matchFilter.subtopic = new mongoose.Types.ObjectId(subtopicId);
    }
    if (levelId) {
      refsToCheck.push({ model: Level, id: levelId, key: "Level ID" });
      matchFilter.level = new mongoose.Types.ObjectId(levelId);
    }

    const { userId: authUserId, role } = req.user;

    if (role === "user") {
      if (queryUserId && queryUserId !== authUserId) {
        return handleError(
          res,
          {},
          "You are not allowed to access other users' questions data.",
          403
        );
      }
      refsToCheck.push({ model: User, id: authUserId, key: "User ID" });
      matchFilter.creator = new mongoose.Types.ObjectId(authUserId);
    } else if (queryUserId) {
      refsToCheck.push({ model: User, id: queryUserId, key: "User ID" });
      matchFilter.creator = new mongoose.Types.ObjectId(queryUserId);
    }

    if (shouldFilterDeleted) matchFilter.deletedAt = null;
    if (shouldFilterImage) matchFilter["image.files.0"] = { $exists: true };

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await verifyModelReferences(refsToCheck);

    // --- Resolve review filters via Review model ---
    const reviewFilter = {};
    if (reviewed === "true") reviewFilter.reviewedAt = { $ne: null };
    if (reviewed === "false")
      reviewFilter.$or = [
        { reviewedAt: null },
        { reviewedAt: { $exists: false } },
      ];
    if (approved === "true") reviewFilter.approved = true;
    if (approved === "false") reviewFilter.approved = false;

    if (Object.keys(reviewFilter).length > 0) {
      const reviewIds = await Review.find(reviewFilter).select("_id").lean();
      matchFilter.review = { $in: reviewIds.map((r) => r._id) };
    }

    const [sortField = "createdAt", sortDirRaw = "desc"] = sort.split(":");
    const sortOrder = sortDirRaw === "asc" ? 1 : -1;

    const total = await Question.countDocuments(matchFilter);

    let query = Question.find(matchFilter)
      .sort({ [sortField]: sortOrder })
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
          select: "_id approved reviewedAt reviewable",
          populate: { path: "reviewedBy", select: "_id name" },
        },
      ])
      .select("-__v -slug");

    if (shouldPaginate) {
      query = query.skip(skip).limit(Number(limit));
    }

    const questions = await query.exec();

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

    return handleSuccess(res, cls, "Question fetched successfully", 200);
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
    const querySchema = z
      .object({
        class: z.string().optional(),
        subject: z.string().optional(),
        topic: z.string().optional(),
        subtopic: z.string().optional(),
        level: z.string().optional(),
        reviewed: z.enum(["true", "false"]).optional(),
        approved: z.enum(["true", "false"]).optional(),
        filterDeleted: z.enum(["true", "false"]).optional().default("true"),
        sort: z.string().optional().default("createdAt:desc"),
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        paginate: z.enum(["true", "false"]).optional().default("false"),
        image: z.enum(["true", "false"]).optional().default("false"),
      })
      .refine(
        (data) => {
          // Subject requires class
          if (data.subject && !data.class) return false;
          // Topic requires subject and class
          if (data.topic && (!data.subject || !data.class)) return false;
          // Subtopic requires topic, subject, class
          if (data.subtopic && (!data.topic || !data.subject || !data.class))
            return false;
          // Level requires subtopic, topic, subject, class
          if (
            data.level &&
            (!data.subtopic || !data.topic || !data.subject || !data.class)
          )
            return false;

          return true;
        },
        {
          message:
            "Hierarchy violation: ensure ancestor fields exist. " +
            "subject requires class; topic requires subject & class; subtopic requires topic, subject & class; level requires subtopic, topic, subject & class",
        }
      );

    // ---------- Validate query params ----------
    const validationResult = validateWithZod(querySchema, req.query);

    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    // ---------- Extract validated values ----------
    const {
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
      image = "false",
    } = req.query;

    const { enterprise } = req.params;

    const shouldPaginate = paginate === "true";
    const shouldFilterDeleted = filterDeleted === "true";

    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const skip = (numericPage - 1) * numericLimit;

    const resolveId = async (model, label, value, extra = {}) => {
      if (!value) return null;
      const filter = {
        ...extra,
        ...(shouldFilterDeleted ? { deletedAt: null } : {}),
      };
      const doc = mongoose.Types.ObjectId.isValid(value)
        ? await model.findOne({ _id: value, ...filter })
        : await model.findOne({ slug: value, ...filter });
      if (!doc) throw new Error(`${label} not found`);
      return doc._id.toString();
    };

    // ---------- Enterprise ----------
    const enterpriseId = await resolveId(Enterprise, "Enterprise", enterprise);

    // ---------- Class ----------
    const classId = await resolveId(Class, "Class", classParam, {
      enterprise: enterpriseId,
    });

    // ---------- Subject ----------
    const subjectId = await resolveId(Subject, "Subject", subject, {
      class: classId,
      enterprise: enterpriseId,
    });

    // ---------- Topic ----------
    const topicId = await resolveId(Topic, "Topic", topic, {
      subject: subjectId,
      class: classId,
      enterprise: enterpriseId,
    });

    // ---------- Subtopic ----------
    const subtopicId = await resolveId(Subtopic, "Subtopic", subtopic, {
      topic: topicId,
      subject: subjectId,
      class: classId,
      enterprise: enterpriseId,
    });

    // ---------- Level ----------
    const levelId = await resolveId(Level, "Level", level, {
      subtopic: subtopicId,
      topic: topicId,
      subject: subjectId,
      class: classId,
      enterprise: enterpriseId,
    });

    const params = { enterprise: enterpriseId };
    if (classId) params.class = classId;
    if (subjectId) params.subject = subjectId;
    if (topicId) params.topic = topicId;
    if (subtopicId) params.subtopic = subtopicId;
    if (levelId) params.level = levelId;
    if (shouldFilterDeleted) params.deletedAt = null;
    if (image === "true") params["image.files.0"] = { $exists: true };

    // --- Review filter fix ---
    const reviewFilter = {};
    if (reviewed === "true") reviewFilter.reviewedAt = { $ne: null };
    if (reviewed === "false")
      reviewFilter.$or = [
        { reviewedAt: null },
        { reviewedAt: { $exists: false } },
      ];
    if (approved === "true") reviewFilter.approved = true;
    if (approved === "false") reviewFilter.approved = false;

    if (Object.keys(reviewFilter).length > 0) {
      const reviewIds = await Review.find(reviewFilter).select("_id").lean();
      params.review = { $in: reviewIds.map((r) => r._id) };
    }

    const [sortField, sortDir] = sort.split(":");
    const sortOption = { [sortField]: sortDir === "asc" ? 1 : -1 };

    const [questions, total] = await Promise.all([
      Question.find(params, "-__v -slug")
        .sort(sortOption)
        .populate([
          { path: "enterprise", select: "_id name slug" },
          { path: "class", select: "_id name slug" },
          { path: "subject", select: "_id name slug" },
          { path: "topic", select: "_id name slug" },
          { path: "subtopic", select: "_id name slug" },
          { path: "level", select: "_id name rank slug" },
        ])
        .skip(shouldPaginate ? skip : 0)
        .limit(shouldPaginate ? numericLimit : 0)
        .lean(),
      Question.countDocuments(params),
    ]);

    // ---------- Format response ----------
    const finalQuestions = questions.map((q) => ({
      _id: q._id,
      type: q.type,
      questionType: q.textType,
      questionText: q.text,
      options: q.options,
      correctAnswer: q.answer,
      hint: q.hint,
      explanation: q.explanation,
      images: q.image?.files || [],
      enterprise: q.enterprise,
      class: q.class,
      subject: q.subject,
      topic: q.topic,
      subtopic: q.subtopic,
      level: q.level,
    }));

    return handleSuccess(
      res,
      {
        ...(shouldPaginate &&
          getPaginationMeta({
            page: numericPage,
            limit: numericLimit,
            totalItems: total,
          })),
        total,
        questions: finalQuestions,
      },
      "Questions fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch questions error:", err);
    if (
      err.message?.includes("not found") ||
      err.message?.includes("invalid hierarchy") ||
      err.message?.includes("with slug")
    ) {
      return handleError(res, {}, err.message, 404);
    }
    return handleError(res, err, "Failed to fetch questions", 500);
  }
};
