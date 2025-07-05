import mongoose from "mongoose";
import { z } from "zod";
import { validateWithZod } from "../validations/validate.js";
import handleError from "../helper/handleError.js";
import Question from "../models/Question.js";
import isValidMongoId from "../helper/isMongoId.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import Review from "../models/Review.js";
import handleSuccess from "../helper/handleSuccess.js";

const reviewSchema = z
  .object({
    questionId: z.string(),
    approved: z.boolean(),
    comment: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.approved === false &&
      (!data.comment || data.comment.trim() === "")
    ) {
      ctx.addIssue({
        path: ["comment"],
        code: z.ZodIssueCode.custom,
        message: "Comment is required when approved is false.",
      });
    }
  });

export const reviewQuestion = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { questionId } = req.params;
    const { approved, comment, rating } = req.body;
    const validationResult = validateWithZod(reviewSchema, {
      questionId,
      approved,
      comment,
      rating,
    });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const reviewerId = req.user?.userId;

    const refsToCheck = [
      { model: Question, id: questionId, key: "Question ID" },
    ];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const review = await session.withTransaction(async () => {
      await verifyModelReferences(refsToCheck, session);

      const updatedReview = await Review.findOneAndUpdate(
        { question: questionId },
        {
          $set: {
            approved,
            comment,
            rating,
            approvedAt: new Date(),
            approvedBy: reviewerId,
          },
        },
        {
          new: true,
          upsert: true,
          session,
        }
      );

      return updatedReview;
    });

    const populatedReview = await Review.findById(review._id, "-__v")
      .populate("approvedBy", "name _id")
      .exec();

    return handleSuccess(
      res,
      populatedReview,
      "Question reviewed successfully",
      200
    );
  } catch (err) {
    console.error("Review question error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    return handleError(res, err, "Failed to review question", 500);
  } finally {
    await session.endSession();
  }
};
