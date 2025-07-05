import express from "express";
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  approveUser,
  getAllUser,
  makeAdmin,
  softDeleteUser,
  demoteAdmin,
} from "../controller/userController.js";
import { authMiddleware, isAdmin, isSuper } from "../middleware/auth.js";

const router = express.Router();

// ✅ Register a new user
router.post("/signup", signup);

// ✅ Login user
router.post("/login", login);

// ✅ Send reset link to user's email
router.post("/forgot-password", forgotPassword);

// ✅ Reset password using token from email
router.patch("/reset-password/:token", resetPassword);

// ✅ Change password (authenticated users only)
router.patch("/change-password", authMiddleware, changePassword);

// Toogle Approve
router.patch("/approve/:userId", authMiddleware, isAdmin, approveUser);

// Promote to admin
router.patch("/promote/:userId", authMiddleware, isAdmin, makeAdmin);

// Soft delete user
router.delete("/:userId", authMiddleware, softDeleteUser);

// Demote admin
router.patch("/demote/:userId", authMiddleware, demoteAdmin);

// Get all users
router.get("/", authMiddleware, isAdmin, getAllUser);

export default router;
