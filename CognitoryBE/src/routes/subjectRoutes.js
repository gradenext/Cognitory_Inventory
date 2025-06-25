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
router.get("/:id", authMiddleware, getSubjectById);
router.post("/", authMiddleware, isAdmin, createSubject);
router.put("/:id", authMiddleware, isAdmin, updateSubject);
router.delete("/:id", authMiddleware, isAdmin, deleteSubject);

export default router;
