import express from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../controller/subjectController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllSubjects);
router.get("/:subjectId", authMiddleware, getSubjectById);
router.post("/", authMiddleware, isAdmin, createSubject);
router.put("/:subjectId", authMiddleware, isAdmin, updateSubject);
router.delete("/:subjectId", authMiddleware, isAdmin, deleteSubject);

export default router;
