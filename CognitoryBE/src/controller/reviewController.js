import mongoose from "mongoose";
import { z } from "zod";
import { validateWithZod } from "../validations/validate.js";
import handleError from "../helper/handleError.js";
import Question from "../models/Question.js";
import isValidMongoId from "../helper/isMongoId.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import Review from "../models/Review.js";
import handleSuccess from "../helper/handleSuccess.js";

const reviewSchema = z.object({
  questionId: z.string(),
  approved: z.boolean(),
  comment: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
});

export const reviewQuestion = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const validationResult = validateWithZod(reviewSchema, req.body);
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const { questionId, approved, comment = "", rating = 0 } = req.body;
    const reviewerId = req.user?.id;

    const refsToCheck = [
      { model: Question, id: questionId, key: "Question ID" },
    ];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const review = await session.withTransaction(async () => {
      const notFound = await verifyModelReferences(refsToCheck, session);
      if (notFound.length > 0) {
        return handleError(res, {}, `${notFound.join(", ")} not found`, 404);
      }

      const existing = await Review.findOne({ questionId }).session(session);

      if (existing) {
        existing.approved = approved;
        existing.comment = comment;
        existing.rating = rating;
        existing.approvedAt = new Date();
        existing.approvedBy = reviewerId;
        await existing.save({ session });
        return existing;
      }

      const [newReview] = await Review.create(
        [
          {
            questionId,
            approved,
            comment,
            rating,
            approvedAt: new Date(),
            approvedBy: reviewerId,
          },
        ],
        { session }
      );

      return newReview;
    });

    const populatedReview = await Review.findById(review._id)
      .populate("approvedBy", "name _id email")
      .populate("questionId", "text _id")
      .exec();

    return handleSuccess(
      res,
      populatedReview,
      "Question reviewed successfully",
      200
    );
  } catch (err) {
    console.error("Review question error:", err);
    return handleError(res, err, "Failed to review question", 500);
  } finally {
    await session.endSession();
  }
};
