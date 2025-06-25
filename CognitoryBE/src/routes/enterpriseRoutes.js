import express from "express";
import {
  createEnterprise,
  getAllEnterprises,
  getEnterpriseById,
  updateEnterprise,
  deleteEnterprise,
} from "../controller/enterpriseController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllEnterprises);
router.get("/:id", authMiddleware, getEnterpriseById);
router.post("/", authMiddleware, isAdmin, createEnterprise);
router.put("/:id", authMiddleware, isAdmin, updateEnterprise);
router.delete("/:id", authMiddleware, isAdmin, deleteEnterprise);

export default router;
