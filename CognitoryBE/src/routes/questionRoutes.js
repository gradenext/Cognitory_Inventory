import express from "express";
import { createQuestion } from "../controller/questionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createQuestion);

export default router;
