import express from "express";
import { authMiddleware, isAdmin } from "../middleware/auth";
import { reviewQuestion } from "../controller/reviewController";

const router = express.Router();

router.post("/:questionId", authMiddleware, isAdmin, reviewQuestion);

export default router;
