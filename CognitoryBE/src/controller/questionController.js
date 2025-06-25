import mongoose from "mongoose";
import Question from "../models/Question.js";
import Enterprise from "../models/Enterprise.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Subtopic from "../models/Subtopic.js";
import Level from "../models/Level.js";
import { addQuestionSchema } from "../validations/question.js";
import { validateWithZod } from "../validations/validate.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import Review from "../models/Review.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import isValidMongoId from "../helper/isMongoId.js";

export const createQuestion = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const validationResult = validateWithZod(addQuestionSchema, req.body);
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const data = req.body;

    const refsToCheck = [
      { model: Enterprise, id: data.enterpriseId, key: "Enterprise ID" },
      { model: Class, id: data.classId, key: "Class ID" },
      { model: Subject, id: data.subjectId, key: "Subject ID" },
      { model: Topic, id: data.topicId, key: "Topic ID" },
      { model: Subtopic, id: data.subtopicId, key: "Subtopic ID" },
      { model: Level, id: data.levelId, key: "Level ID" },
    ];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await session.startTransaction();
    transactionStarted = true;

    const notExistIds = await verifyModelReferences(session, refsToCheck);
    if (notExistIds.length > 0) {
      await session.abortTransaction();
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const [createdQuestion] = await Question.create([{ ...data }], { session });

    const [createdReview] = await Review.create(
      [{ questionId: createdQuestion._id }],
      { session }
    );

    createdQuestion.reviewId = createdReview._id;
    await createdQuestion.save({ session });

    await createdQuestion.populate({ path: "reviewId", options: { session } });

    await session.commitTransaction();
    transactionStarted = false;

    return handleSuccess(
      res,
      { question: createdQuestion },
      "Question created successfully",
      201
    );
  } catch (error) {
    if (transactionStarted) await session.abortTransaction();
    return handleError(res, error, "Internal Server Error", 500);
  } finally {
    session.endSession();
  }
};
