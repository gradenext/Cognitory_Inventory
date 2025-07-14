import express from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  softUpdateSubjectName,
} from "../controller/subjectController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllSubjects);
router.get("/:subjectId", authMiddleware, getSubjectById);
router.post("/", authMiddleware, isAdmin, createSubject);
router.patch("/:subjectId", authMiddleware, isAdmin, softUpdateSubjectName);

export default router;
