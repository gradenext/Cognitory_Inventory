import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  softUpdateClassName,
} from "../controller/classController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllClasses);
router.get("/:classId", authMiddleware, getClassById);
router.post("/", authMiddleware, isAdmin, createClass);
router.patch("/:classId", authMiddleware, isAdmin, softUpdateClassName);

export default router;
