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
router.get("/:id", authMiddleware, getSubtopicById);
router.post("/", authMiddleware, isAdmin, createSubtopic);
router.put("/:id", authMiddleware, isAdmin, updateSubtopic);
router.delete("/:id", authMiddleware, isAdmin, deleteSubtopic);

export default router;
