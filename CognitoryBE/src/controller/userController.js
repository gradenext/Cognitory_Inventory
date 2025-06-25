import User from "../models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { validateWithZod } from "../validations/validate.js";
import { userLogin, userSchema } from "../validations/user.js";
import { sendMail } from "../utils/mailer.js";
import {
  approvedTemplate,
  forgotPasswordTemplate,
  passwordChangedTemplate,
  signupTemplate,
} from "../utils/mailTemplate.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in environment");

// SIGNUP

export const signup = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const validationResult = validateWithZod(userSchema, req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationResult.errors,
      });
    }

    const { name, email, password } = req.body;

    session.startTransaction();

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(
      [
        {
          name,
          email,
          password: hashedPassword,
          role: "user",
        },
      ],
      { session }
    );

    try {
      await sendMail({
        to: user[0].email,
        subject: "Signup Successful - Awaiting Approval",
        html: signupTemplate(user[0].name),
      });
    } catch (mailErr) {
      await session.abortTransaction();
      session.endSession();
      console.error("Email sending failed:", mailErr);
      return res.status(500).json({
        success: false,
        message: "Signup failed during email sending",
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user[0]._id,
        name: user[0].name,
        email: user[0].email,
        role: user[0].role,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Signup Error:", err);
    return res.status(500).json({
      success: false,
      message: "Signup failed",
      error: err.message || err,
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    // Validate input
    const validationResult = validateWithZod(userLogin, req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationResult.errors,
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check approval status
    if (user.approved === false) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is not approved yet. Please wait for admin approval.",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT (no expiration)
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.image,
        role: user.role,
        approved: user.approved,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: err.message || err,
    });
  }
};

// APPROVE USER (admin only)
export const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    if (typeof approved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Approved value must be true or false",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent redundant updates
    if (user.approved === approved) {
      return res.status(400).json({
        success: false,
        message: `User is already ${approved ? "approved" : "unapproved"}`,
      });
    }

    // Update approval status
    user.approved = approved;
    await user.save();

    // If approved now, send email
    if (approved) {
      await sendMail({
        to: user.email,
        subject: "Your Account is Approved 🎉",
        html: approvedTemplate(user.name),
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${approved ? "approved" : "unapproved"} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        approved: user.approved,
      },
    });
  } catch (err) {
    console.error("Approval Error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating approval status",
      error: err.message || err,
    });
  }
};

// FORGOT PASSWORD (send reset link)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate reset token (valid for 15 min)
    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "15m",
    });
    const resetLink = `${process.env.FRONTEND_LINK}/reset-password/${resetToken}`;

    // Send reset link email
    await sendMail({
      to: email,
      subject: "Password Reset Request",
      html: forgotPasswordTemplate(user.name, resetLink),
    });

    return res.json({ success: true, message: "Reset link sent to email" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Forgot password failed", error: err });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Password Changed Successfully",
      html: passwordChangedTemplate(user.name),
    });

    return res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Reset password failed", error: err });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid)
      return res
        .status(400)
        .json({ success: false, message: "Old password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Password Changed",
      html: passwordChangedTemplate(user.name),
    });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Change Password Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Change password failed", error: err });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const users = await User.find({}, "-password -__v");

    return res.json({
      success: true,
      message: "All users fetched successfully",
      users,
    });
  } catch (err) {
    console.error("Fetch all users Error:", err);
    return res.status(500).json({
      success: false,
      message: "Fetch all users failed",
      error: err.message,
    });
  }
};
