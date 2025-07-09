import express from "express";
import { getFullCurriculum } from "../controller/miscellnousController.js";
import { authMiddleware, isSuper } from "../middleware/auth.js";

const router = express.Router();

router.get("/curriculum/:id", authMiddleware, isSuper, getFullCurriculum);

export default router;
