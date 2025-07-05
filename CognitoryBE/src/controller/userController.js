import User from "../models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { validateWithZod } from "../validations/validate.js";
import {
  changePasswordSchema,
  resetPasswordSchema,
  userLogin,
  userSchema,
} from "../validations/user.js";
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
import { z } from "zod";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in environment");

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

export const signup = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { name, email, password, confirmPassword } = req.body;

    const validationResult = validateWithZod(userSchema, {
      name,
      email,
      password,
      confirmPassword,
    });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const createdUser = await session.withTransaction(async () => {
      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [user] = await User.create(
        [{ name, email, password: hashedPassword, role: "user" }],
        { session }
      );

      await sendMail({
        to: user.email,
        subject: "Signup Successful - Awaiting Approval",
        html: signupTemplate(user.name),
      });

      return user;
    });

    return handleSuccess(
      res,
      {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
      },
      "User registered successfully",
      201
    );
  } catch (err) {
    console.error("Signup error:", err);

    if (err.message?.includes("already exists")) {
      return handleError(res, {}, err.message, 409);
    }

    return handleError(res, err, "Signup failed", 500);
  } finally {
    await session.endSession();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const validationResult = validateWithZod(userLogin, { email, password });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return handleError(res, {}, "Invalid email or password", 401);
    }

    if (user.approved === false) {
      return handleError(
        res,
        {},
        "Your account is not approved yet. Please wait for admin approval.",
        403
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return handleError(res, {}, "Invalid email or password", 401);
    }

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
    console.error("Login error:", err);
    return handleError(res, err, "Login failed", 500);
  }
};

export const approveUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { userId } = req.params;
    if (!userId) return handleError(res, {}, "User ID is required", 400);

    const invalidIds = isValidMongoId([{ id: userId, key: "User ID" }]);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const updatedUser = await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error("User not found");

      user.approved = !user.approved;
      user.approvedAt = Date.now();
      user.approvedBy = req.user.userId;
      await user.save({ session });

      const approver = await User.findById(req.user.userId, "name _id").session(
        session
      );

      if (user.approved) {
        await sendMail({
          to: user.email,
          subject: "Your Account is Approved 🎉",
          html: approvedTemplate(user.name),
        });
      }

      return { user, approver };
    });

    return handleSuccess(
      res,
      {
        _id: updatedUser.user._id,
        name: updatedUser.user.name,
        email: updatedUser.user.email,
        approved: updatedUser.user.approved,
        approvedAt: updatedUser.user.approvedAt,
        approvedBy: updatedUser.approver,
      },
      `User ${
        updatedUser.user.approved ? "approved" : "unapproved"
      } successfully`,
      201
    );
  } catch (err) {
    console.error("Approve user error:", err);
    if (err.message?.includes("not found"))
      return handleError(res, {}, err.message, 404);
    return handleError(res, err, "Failed to approve user", 500);
  } finally {
    await session.endSession();
  }
};

export const makeAdmin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { userId } = req.params;

    if (!userId) {
      return handleError(res, {}, "User ID is required", 400);
    }

    const invalidIds = isValidMongoId([{ id: userId, key: "User ID" }]);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const updatedUser = await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error("User not found");

      user.role = "admin";
      await user.save({ session });

      await sendMail({
        to: user.email,
        subject: "You have been made an Admin 🎉",
        html: `<p>Hi ${user.name},</p><p>Your role has been updated to <strong>Admin</strong>. You now have access to administrative features.</p>`,
      });

      return user;
    });

    return handleSuccess(
      res,
      {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      "User promoted to admin successfully",
      200
    );
  } catch (err) {
    console.error("Make admin error:", err);
    if (err.message?.includes("not found"))
      return handleError(res, {}, err.message, 404);
    return handleError(res, err, "Failed to make user admin", 500);
  } finally {
    await session.endSession();
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const validationResult = validateWithZod(
      z.object({ email: z.string().email() }),
      { email }
    );
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return handleError(res, {}, "User not found", 404);
    }

    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "15m",
    });
    const resetLink = `https://cognitory.vercel.app/reset-password/${resetToken}`;

    await sendMail({
      to: email,
      subject: "Password Reset Request",
      html: forgotPasswordTemplate(user.name, resetLink),
    });

    return handleSuccess(res, {}, "Reset link sent to email", 200);
  } catch (err) {
    console.error("Forgot Password Error:", err);
    return handleError(res, err, "Forgot password failed", 500);
  }
};

export const resetPassword = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    const validationResult = validateWithZod(resetPasswordSchema, {
      newPassword,
      confirmPassword,
    });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    if (newPassword !== confirmPassword) {
      return handleError(res, {}, "Passwords do not match", 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("JWT verification failed:", err);
      return handleError(res, {}, "Invalid or expired token", 401);
    }

    const updatedUser = await session.withTransaction(async () => {
      const user = await User.findById(decoded.id).session(session);
      if (!user) throw new Error("User not found");

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save({ session });

      return user;
    });

    await sendMail({
      to: updatedUser.email,
      subject: "Password Changed Successfully",
      html: passwordChangedTemplate(updatedUser.name),
    });

    return handleSuccess(res, {}, "Password has been reset successfully", 200);
  } catch (err) {
    console.error("Reset Password Error:", err);
    if (err.message?.includes("not found"))
      return handleError(res, {}, err.message, 404);
    return handleError(res, err, "Reset password failed", 500);
  } finally {
    await session.endSession();
  }
};

export const changePassword = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
      return handleError(res, {}, "Unauthorized access", 401);
    }

    const validationResult = validateWithZod(changePasswordSchema, {
      oldPassword,
      newPassword,
      confirmPassword,
    });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    if (newPassword !== confirmPassword) {
      return handleError(res, {}, "Passwords do not match", 400);
    }

    const updatedUser = await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error("User not found");

      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) throw new Error("Old password incorrect");

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save({ session });

      return user;
    });

    await sendMail({
      to: updatedUser.email,
      subject: "Password Changed",
      html: passwordChangedTemplate(updatedUser.name),
    });

    return handleSuccess(res, {}, "Password changed successfully", 200);
  } catch (err) {
    console.error("Change Password Error:", err);
    if (
      err.message?.includes("not found") ||
      err.message?.includes("incorrect")
    ) {
      return handleError(res, {}, err.message, 400);
    }
    return handleError(res, err, "Change password failed", 500);
  } finally {
    await session.endSession();
  }
};

export const softDeleteUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { userId } = req.params;

    const invalidIds = isValidMongoId([{ id: userId, key: "User ID" }]);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const deletedUser = await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error("User not found");

      user.deletedAt = new Date();
      await user.save({ session });

      return await User.findById(userId)
        .select("-password -__v")
        .session(session);
    });

    return handleSuccess(
      res,
      deletedUser,
      "User soft deleted successfully",
      200
    );
  } catch (err) {
    console.error("Soft delete user error:", err);
    if (err.message?.includes("not found"))
      return handleError(res, {}, err.message, 404);
    return handleError(res, err, "Failed to soft delete user", 500);
  } finally {
    await session.endSession();
  }
};

export const demoteAdmin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { userId } = req.params;

    const invalidIds = isValidMongoId([{ id: userId, key: "User ID" }]);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const updatedUser = await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error("User not found");

      if (user.role !== "admin") {
        throw new Error("User is not an admin");
      }

      user.role = "user";
      await user.save({ session });

      return await User.findById(user._id)
        .select("-password -__v")
        .session(session);
    });

    return handleSuccess(
      res,
      updatedUser,
      "Admin demoted to user successfully",
      200
    );
  } catch (err) {
    console.error("Demote admin error:", err);
    if (
      err.message?.includes("not found") ||
      err.message?.includes("not an admin")
    )
      return handleError(res, {}, err.message, 400);
    return handleError(res, err, "Failed to demote admin", 500);
  } finally {
    await session.endSession();
  }
};
