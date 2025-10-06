import express from "express";
import {
  createQuestion,
  editQuestion,
  getAllQuestions,
  getGradeNextQuestions,
  getOneUnreviewedQuestion,
  getQuestionById,
  softDeleteQuestion,
} from "../controller/questionController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createQuestion);
router.patch("/:questionId", authMiddleware, editQuestion);
router.get("/", authMiddleware, getAllQuestions);
router.get("/:questionId", authMiddleware, getQuestionById);
router.get("/custom/:enterpriseId", authMiddleware, getGradeNextQuestions);
router.get(
  "/unreviewed/single",
  authMiddleware,
  isAdmin,
  getOneUnreviewedQuestion
);
router.delete("/:questionId", authMiddleware, isAdmin, softDeleteQuestion);

export default router;
