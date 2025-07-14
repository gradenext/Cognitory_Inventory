import express from "express";
import {
  createTopic,
  getAllTopics,
  getTopicById,
  softUpdateTopicName,
} from "../controller/topicController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllTopics);
router.get("/:topicId", authMiddleware, getTopicById);
router.post("/", authMiddleware, isAdmin, createTopic);
router.patch("/:topicId", authMiddleware, isAdmin, softUpdateTopicName);

export default router;
