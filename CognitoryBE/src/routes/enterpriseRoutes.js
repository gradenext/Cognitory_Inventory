import express from "express";
import {
  createEnterprise,
  getAllEnterprises,
  getEnterpriseById,
  updateEnterprise,
  deleteEnterprise,
} from "../controller/enterpriseController.js";
import { authMiddleware, isAdmin, isSuper } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllEnterprises);
router.get("/:enterpriseId", authMiddleware, getEnterpriseById);
router.post("/", authMiddleware, isAdmin, createEnterprise);
router.put("/:enterpriseId", authMiddleware, isAdmin, updateEnterprise);
router.delete("/:enterpriseId", authMiddleware, isSuper, deleteEnterprise);

export default router;
