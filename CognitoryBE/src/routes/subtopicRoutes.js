import express from "express";
import {
  createSubtopic,
  getAllSubtopics,
  getSubtopicById,
  updateSubtopic,
  deleteSubtopic,
} from "../controller/subtopicController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllSubtopics);
router.get("/:subtopicId", authMiddleware, getSubtopicById);
router.post("/", authMiddleware, isAdmin, createSubtopic);
router.put("/:subtopicId", authMiddleware, isAdmin, updateSubtopic);
router.delete("/:subtopicId", authMiddleware, isAdmin, deleteSubtopic);

export default router;
