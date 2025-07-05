import express from "express";
import { authMiddleware, isAdmin } from "../middleware/auth.js";
import { reviewQuestion } from "../controller/reviewController.js";

const router = express.Router();

router.post("/:questionId", authMiddleware, isAdmin, reviewQuestion);

export default router;
