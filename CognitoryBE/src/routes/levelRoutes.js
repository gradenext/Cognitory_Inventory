import express from "express";
import {
  createLevel,
  getAllLevels,
  getLevelById,
  updateLevel,
  deleteLevel,
} from "../controller/levelController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllLevels);
router.get("/:id", authMiddleware, getLevelById);
router.post("/", authMiddleware, isAdmin, createLevel);
router.put("/:id", authMiddleware, isAdmin, updateLevel);
router.delete("/:id", authMiddleware, isAdmin, deleteLevel);

export default router;
