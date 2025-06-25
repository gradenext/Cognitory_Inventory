import express from "express";
import {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
} from "../controller/topicController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllTopics);
router.get("/:id", authMiddleware, getTopicById);
router.post("/", authMiddleware, isAdmin, createTopic);
router.put("/:id", authMiddleware, isAdmin, updateTopic);
router.delete("/:id", authMiddleware, isAdmin, deleteTopic);

export default router;
