import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../controller/classController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllClasses);
router.get("/:id", authMiddleware, getClassById);
router.post("/", authMiddleware, isAdmin, createClass);
router.put("/:id", authMiddleware, isAdmin, updateClass);
router.delete("/:id", authMiddleware, isAdmin, deleteClass);

export default router;
