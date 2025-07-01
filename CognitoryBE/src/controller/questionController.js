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
  let transactionStarted = false;

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
      { model: User, id: userId, key: "User" },
    ];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await session.startTransaction();
    transactionStarted = true;

    const notExistIds = await verifyModelReferences(refsToCheck, session);
    if (notExistIds.length > 0) {
      await session.abortTransaction();
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const [createdQuestion] = await Question.create(
      [
        {
          text,
          textType,
          image: {
            uuid: imageUUID,
            files: images,
          },
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

    const [createdReview] = await Review.create(
      [{ questionId: createdQuestion._id }],
      { session }
    );

    createdQuestion.review = createdReview._id;
    await createdQuestion.save({ session });

    await createdQuestion.populate({ path: "review", options: { session } });

    await session.commitTransaction();
    transactionStarted = false;

    return handleSuccess(
      res,
      createdQuestion,
      "Question created successfully",
      201
    );
  } catch (error) {
    if (transactionStarted) await session.abortTransaction();
    console.log(error);
    return handleError(res, error, "Internal Server Error", 500);
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
      paginate = "true",
    } = req.query;

    const { userId, role } = req.user;

    const skip = (page - 1) * limit;
    const shouldPaginate = paginate === "true";

    let refsToCheck = [];
    let params = {};

    if (enterpriseId) {
      refsToCheck.push({
        model: Enterprise,
        id: enterpriseId,
        key: "Enterprise ID",
      });

      params["enterprise"] = enterpriseId;
    }

    if (classId) {
      refsToCheck.push({
        model: Class,
        id: classId,
        key: "Class ID",
      });

      params["class"] = classId;
    }
    if (subjectId) {
      refsToCheck.push({
        model: Subject,
        id: subjectId,
        key: "Subject ID",
      });

      params["subject"] = subjectId;
    }
    if (topicId) {
      refsToCheck.push({
        model: Topic,
        id: topicId,
        key: "Topic ID",
      });

      params["topic"] = topicId;
    }
    if (subtopicId) {
      refsToCheck.push({
        model: Subtopic,
        id: subtopicId,
        key: "Sub Topic ID",
      });

      params["subtopic"] = subtopicId;
    }
    if (levelId) {
      refsToCheck.push({
        model: Level,
        id: levelId,
        key: "Level ID",
      });

      params["level"] = levelId;
    }

    if (userId && role === "user") {
      refsToCheck.push({
        model: User,
        id: userId,
        key: "User ID",
      });

      params["creator"] = userId;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const notExistIds = await verifyModelReferences(refsToCheck);
    if (notExistIds.length > 0) {
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const query = Question.find(params, "-__v").populate([
      { path: "enterprise", select: "_id name" },
      { path: "class", select: "_id name" },
      { path: "subject", select: "_id name" },
      { path: "topic", select: "_id name" },
      { path: "subtopic", select: "_id name" },
      { path: "level", select: "_id name" },
      { path: "creator", select: "_id name" },
      { path: "review", select: "-__v" },
    ]);

    if (shouldPaginate) {
      query.skip(skip).limit(limit);
    }

    const questions = await query.exec();
    const totalCount = await Question.countDocuments(params);

    return handleSuccess(
      res,
      {
        ...(shouldPaginate && {
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount / limit),
        }),
        total: totalCount,
        questions,
      },
      "Questions fetched successfully",
      200
    );
  } catch (error) {
    console.log(err);
    return handleError(res, err, "Failed to fetch questions", 500);
  }
};
