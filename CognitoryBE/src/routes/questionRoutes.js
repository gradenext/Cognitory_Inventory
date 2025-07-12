import express from "express";
import {
  createQuestion,
  getAllQuestions,
  getOneUnreviewedQuestion,
  getQuestionById,
  softDeleteQuestion,
} from "../controller/questionController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createQuestion);
router.get("/", authMiddleware, getAllQuestions);
router.get("/questionId", authMiddleware, getQuestionById);
router.get(
  "/unreviewed/single",
  authMiddleware,
  isAdmin,
  getOneUnreviewedQuestion
);
router.delete("/question/questionId", isAdmin, softDeleteQuestion);

export default router;
