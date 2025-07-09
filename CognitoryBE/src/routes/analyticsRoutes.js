import express from "express";
// import {} from "../controller/analyticsController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

export default router;
