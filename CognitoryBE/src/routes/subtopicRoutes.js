import express from "express";
import {
  createSubtopic,
  getAllSubtopics,
  getSubtopicById,
  softUpdateSubtopicName,
} from "../controller/subtopicController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllSubtopics);
router.get("/:subtopicId", authMiddleware, getSubtopicById);
router.post("/", authMiddleware, isAdmin, createSubtopic);
router.patch("/:subtopicId", authMiddleware, isAdmin, softUpdateSubtopicName);

export default router;
