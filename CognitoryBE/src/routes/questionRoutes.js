import express from "express";
import {
  createQuestion,
  getAllQuestions,
  getOneUnreviewedQuestion,
  getQuestionById,
} from "../controller/questionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createQuestion);
router.get("/", authMiddleware, getAllQuestions);
router.get("/questionId", authMiddleware, getQuestionById);
router.get("/unreviewed/single", authMiddleware, getOneUnreviewedQuestion);

export default router;
