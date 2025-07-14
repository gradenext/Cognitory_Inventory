import express from "express";
import {
  createEnterprise,
  getAllEnterprises,
  getEnterpriseById,
  updateEnterprise,
} from "../controller/enterpriseController.js";
import { authMiddleware, isAdmin, isSuper } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllEnterprises);
router.get("/:enterpriseId", authMiddleware, getEnterpriseById);
router.post("/", authMiddleware, isAdmin, createEnterprise);
router.patch("/:enterpriseId", authMiddleware, isAdmin, updateEnterprise);

export default router;
