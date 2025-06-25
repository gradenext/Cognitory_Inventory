import express from "express";
import { uploadFiles } from "../controller/utilController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/upload", authMiddleware, uploadFiles);

export default router;
