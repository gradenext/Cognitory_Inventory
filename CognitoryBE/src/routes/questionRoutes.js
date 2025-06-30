import express from "express";
import { createQuestion, getAllQuestions } from "../controller/questionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createQuestion);
router.get("/", authMiddleware, getAllQuestions);

export default router;
