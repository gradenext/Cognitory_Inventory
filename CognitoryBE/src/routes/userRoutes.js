import express from "express";
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  approveUser,
  getAllUser,
} from "../controller/userController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// ✅ Register a new user
router.post("/signup", signup);

// ✅ Login user
router.post("/login", login);

// ✅ Send reset link to user's email
router.post("/forgot-password", forgotPassword);

// ✅ Reset password using token from email
router.post("/reset-password/:token", resetPassword);

// ✅ Change password (authenticated users only)
router.post("/change-password", authMiddleware, changePassword);

// Approve a user
router.post("/approve/:id", authMiddleware, isAdmin, approveUser);

// Get all users
router.get("/", authMiddleware, isAdmin, getAllUser);

export default router;
