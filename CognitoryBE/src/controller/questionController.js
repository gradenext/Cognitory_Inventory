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

      const [review] = await Review.create([{ questionId: question._id }], {
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
      page = 1,
      limit = 10,
      paginate = "false",
      filterDeleted = "false",
      approved,
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

    if (approved === "true") {
      params.approved = approved;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await verifyModelReferences(refsToCheck);

    const query = Question.find(params, "-__v").populate([
      { path: "enterprise", select: "_id name" },
      { path: "class", select: "_id name" },
      { path: "subject", select: "_id name" },
      { path: "topic", select: "_id name" },
      { path: "subtopic", select: "_id name" },
      { path: "level", select: "_id name" },
      { path: "creator", select: "_id name" },
      { path: "review", select: "-__v" },
      {
        path: "review",
        select: "-__v",
        match:
          approved === "true"
            ? { approved: true }
            : approved === "false"
            ? { approved: false }
            : {},
      },
    ]);

    if (approved === "true" || approved === "false") {
      query.where("review").ne(null);
    }

    if (shouldPaginate) {
      query.skip(skip).limit(Number(limit));
    }

    const [questions, totalCount] = await Promise.all([
      query.exec(),
      Question.countDocuments(params),
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

    const cls = await Question.findOne(filter, "-slug -__v");
    if (!cls) {
      return handleError(res, {}, "Class not found", 404);
    }

    return handleSuccess(res, cls, "Class fetched successfully", 200);
  } catch (err) {
    console.error(err);
    return handleError(res, err, "Failed to fetch class", 500);
  }
};
