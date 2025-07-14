import express from "express";
import {
  createLevel,
  getAllLevels,
  getLevelById,
  softUpdateLevelName,
} from "../controller/levelController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllLevels);
router.get("/:levelId", authMiddleware, getLevelById);
router.post("/", authMiddleware, isAdmin, createLevel);
router.patch("/:levelId", authMiddleware, isAdmin, softUpdateLevelName);

export default router;
