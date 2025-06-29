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
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import isValidMongoId from "../helper/isMongoId.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in environment");

// SIGNUP

export const signup = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const validationResult = validateWithZod(userSchema, req.body);
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const { name, email, password } = req.body;

    await session.startTransaction();
    transactionStarted = true;

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return handleError(res, {}, "User already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await User.create(
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
        to: user.email,
        subject: "Signup Successful - Awaiting Approval",
        html: signupTemplate(user.name),
      });
    } catch (mailErr) {
      await session.abortTransaction();
      console.error("Email sending failed:", mailErr);
      return handleError(
        res,
        { mailErr },
        "Signup failed during email sending",
        500
      );
    }

    await session.commitTransaction();
    transactionStarted = false;

    return handleSuccess(
      res,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      "User registered successfully",
      201
    );
  } catch (err) {
    if (transactionStarted) {
      await session.abortTransaction();
    }
    console.error("Create user error:", err);
    return handleError(res, err, "Signup failed", 500);
  } finally {
    await session.endSession();
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    // Validate input
    const validationResult = validateWithZod(userLogin, req.body);
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return handleError(res, {}, "Invalid email or password", 401);
    }

    // Check approval status
    if (user.approved === false) {
      return handleError(
        res,
        {},
        "Your account is not approved yet. Please wait for admin approval.",
        403
      );
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return handleError(res, {}, "Invalid email or password", 401);
    }

    // Generate JWT (no expiration)
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET
    );

    return handleSuccess(
      res,
      {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          photo: user.image,
          role: user.role,
          approved: user.approved,
        },
      },
      "Login successful",
      200
    );
  } catch (err) {
    console.error("Create user error:", err);
    return handleError(res, err, "Login failed", 500);
  }
};

// APPROVE USER (admin only)
export const approveUser = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;
  try {
    const { userId } = req.params;

    if (!userId) {
      return handleError(res, {}, "UserId is required", 400);
    }

    const refsToCheck = [{ id: userId, key: "User ID" }];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await session.startTransaction();
    transactionStarted = true;

    const user = await User.findById(userId).session(session);
    if (!user) {
      if (transactionStarted) {
        await session.abortTransaction();
      }
      return handleError(res, {}, "User does not exist", 404);
    }

    user.approved = !user.approved;
    user.approvedAt = Date.now();
    user.approvedBy = req.user.userId;
    await user.save({ session });

    const approver = await User.findById(req.user.userId, "name _id").session(
      session
    );

    // If approved now, send email
    if (user.approved) {
      await sendMail({
        to: user.email,
        subject: "Your Account is Approved 🎉",
        html: approvedTemplate(user.name),
      });
    }

    await session.commitTransaction();
    transactionStarted = false;

    return handleSuccess(
      res,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        approved: user.approved,
        approvedAt: user.approvedAt,
        approvedBy: approver,
      },
      `User ${user.approved ? "approved" : "unapproved"} successfully`,
      201
    );
  } catch (err) {
    if (transactionStarted) {
      await session.abortTransaction();
    }

    console.error("Approve user error:", err);
    return handleError(res, err, "Failed to approve user", 500);
  } finally {
    await session.endSession();
  }
};

export const makeAdmin = async (req, res) => {};

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
    const users = await User.find({}, "-password -__v")
      .populate("approvedBy", "name _id")
      .exec();

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
