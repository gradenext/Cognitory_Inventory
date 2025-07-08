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
    editAllowed: z.boolean(),
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
    const { approved, comment, rating, editAllowed } = req.body;
    const validationResult = validateWithZod(reviewSchema, {
      questionId,
      approved,
      comment,
      rating,
      editAllowed,
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

      const existingReview = await Review.findOne({
        question: questionId,
      }).session(session);
      if (!existingReview) {
        return handleError(res, {}, "Review not found for this question", 404);
      }

      if (existingReview?.approvedAt) {
        return handleError(
          res,
          {},
          "A question can't be reviewed again use update",
          404
        );
      }

      existingReview.approved = approved;
      existingReview.editAllowed = editAllowed;
      existingReview.comment = comment;
      existingReview.rating = rating;
      existingReview.reviewedAt = new Date();
      existingReview.reviewedBy = reviewerId;

      await existingReview.save({ session });

      return existingReview;
    });

    const populatedReview = await Review.findById(review._id, "-__v")
      .populate("reviewedBy", "name _id")
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
    if (err.message?.includes("reviewed again")) {
      return handleError(res, {}, err.message, 404);
    }

    return handleError(res, err, "Failed to review question", 500);
  } finally {
    await session.endSession();
  }
};
