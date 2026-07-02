import express from "express";
import {
  getTopicContents,
  createTopicContent,
  updateTopicContent,
  uploadTopicContentFile,
  deleteTopicContent,
} from "../controller/topicContentController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

router.get("/", authMiddleware, getTopicContents);
router.post("/", authMiddleware, isAdmin, createTopicContent);
router.patch("/:contentId", authMiddleware, isAdmin, updateTopicContent);
router.post("/:contentId/upload", authMiddleware, isAdmin, uploadTopicContentFile);
router.delete("/:contentId", authMiddleware, isAdmin, deleteTopicContent);

export default router;
