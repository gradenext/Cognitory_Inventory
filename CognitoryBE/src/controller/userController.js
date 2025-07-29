import User from "../models/User.js";
import Enterprise from "../models/Enterprise.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Subtopic from "../models/Subtopic.js";
import Level from "../models/Level.js";
import Question from "../models/Question.js";
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
    // Exclude super users if requester is not super
    const filter = req.user.role === "super" ? {} : { role: { $ne: "super" } };

    const users = await User.find(filter, "-password -__v -slug")
      .populate("approvedBy", "name")
      .lean();

    // Get IDs of users with role 'user'
    const userOnly = users.filter((u) => u.role === "user");
    const userOnlyIds = userOnly.map((u) => u._id);

    // Fetch all questions created by those users
    const questions = await Question.find({ creator: { $in: userOnlyIds } })
      .populate("review", "approved reviewedAt rating")
      .lean();

    // Build analytics map
    const statsMap = {};

    for (const q of questions) {
      const userId = q.creator?.toString();
      if (!userId) continue;

      if (!statsMap[userId]) {
        statsMap[userId] = {
          questionCount: 0,
          reviewedCount: 0,
          approvedCount: 0,
          unapprovedCount: 0,
          totalRating: 0,
          ratingCount: 0,
        };
      }

      const s = statsMap[userId];
      s.questionCount++;

      if (q.review?.reviewedAt) {
        s.reviewedCount++;
        if (q.review.approved === true) {
          s.approvedCount++;
        } else {
          s.unapprovedCount++;
        }

        if (typeof q.review.rating === "number") {
          s.totalRating += q.review.rating;
          s.ratingCount++;
        }
      }
    }

    // Attach analytics only to role "user"
    const finalUsers = users.map((user) => {
      if (user.role === "user") {
        const stat = statsMap[user._id.toString()] || {};
        const avgRating =
          stat.ratingCount > 0
            ? Number((stat.totalRating / stat.ratingCount).toFixed(2))
            : null;

        return {
          ...user,
          questionCount: stat.questionCount || 0,
          reviewedCount: stat.reviewedCount || 0,
          approvedCount: stat.approvedCount || 0,
          unapprovedCount: stat.unapprovedCount || 0,
          averageRating: avgRating,
        };
      }

      return user; // no stats for other roles
    });

    return res.json({
      success: true,
      message: "All users fetched successfully",
      users: finalUsers,
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
      "Login successfull",
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

      if (user?.role === "super")
        throw new Error("You can't change super admin data");

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
    if (err.message?.includes("super admin "))
      return handleError(res, {}, err.message, 201);
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

      if (user?.role === "super")
        throw new Error("You can't change super admin role");

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

    if (err.message?.includes("super admin role"))
      return handleError(res, {}, err.message, 201);

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
    const userId = req.user?.userId;
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!userId) {
      return handleError(res, {}, "Unauthorized access", 401);
    }

    const validationResult = validateWithZod(changePasswordSchema, {
      oldPassword,
      newPassword,
      confirmNewPassword,
    });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
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

      if (user?.role === "super") {
        throw new Error("Super admin can't be demoted");
      }

      if (user?.role !== "admin") {
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
      {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
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

    if (err.message?.includes("Super admin"))
      return handleError(res, {}, err.message, 201);

    return handleError(res, err, "Failed to demote admin", 500);
  } finally {
    await session.endSession();
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { role, userId: authUserId } = req.user;
    let userId;

    if (role === "user") {
      userId = authUserId;
    } else {
      userId = req.params.userId;
    }

    if (!userId) {
      return handleError(res, {}, "User ID is required", 400);
    }

    const user = await User.findById(userId, "-questions -password -__v -slug")
      .populate("approvedBy", "name email role")
      .lean();

    if (!user) {
      return handleError(res, {}, "User not found", 404);
    }

    // 1. Load full hierarchy
    const [enterprises, classes, subjects, topics, subtopics, levels] =
      await Promise.all([
        Enterprise.find({ deletedAt: null }, "_id name").lean(),
        Class.find({ deletedAt: null }, "_id name").lean(),
        Subject.find({ deletedAt: null }, "_id name class").lean(),
        Topic.find({ deletedAt: null }, "_id name subject").lean(),
        Subtopic.find({ deletedAt: null }, "_id name topic").lean(),
        Level.find({ deletedAt: null }, "_id name subtopic").lean(),
      ]);

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const tree = {};
    for (const ent of enterprises) {
      const entNode = (tree[ent._id.toString()] = {
        _id: ent._id,
        name: ent.name,
        count: 0,
        thisWeek: 0,
        thisMonth: 0,
        approved: 0,
        approvedThisWeek: 0,
        approvedThisMonth: 0,
        classes: {},
      });

      for (const cls of classes) {
        const clsNode = (entNode.classes[cls._id.toString()] = {
          _id: cls._id,
          name: cls.name,
          count: 0,
          thisWeek: 0,
          thisMonth: 0,
          approved: 0,
          approvedThisWeek: 0,
          approvedThisMonth: 0,
          subjects: {},
        });

        for (const subj of subjects.filter(
          (s) => s.class?.toString() === cls._id.toString()
        )) {
          const subjNode = (clsNode.subjects[subj._id.toString()] = {
            _id: subj._id,
            name: subj.name,
            count: 0,
            thisWeek: 0,
            thisMonth: 0,
            approved: 0,
            approvedThisWeek: 0,
            approvedThisMonth: 0,
            topics: {},
          });

          for (const topic of topics.filter(
            (t) => t.subject?.toString() === subj._id.toString()
          )) {
            const topicNode = (subjNode.topics[topic._id.toString()] = {
              _id: topic._id,
              name: topic.name,
              count: 0,
              thisWeek: 0,
              thisMonth: 0,
              approved: 0,
              approvedThisWeek: 0,
              approvedThisMonth: 0,
              subtopics: {},
            });

            for (const subt of subtopics.filter(
              (s) => s.topic?.toString() === topic._id.toString()
            )) {
              const subtNode = (topicNode.subtopics[subt._id.toString()] = {
                _id: subt._id,
                name: subt.name,
                count: 0,
                thisWeek: 0,
                thisMonth: 0,
                approved: 0,
                approvedThisWeek: 0,
                approvedThisMonth: 0,
                levels: {},
              });

              for (const lvl of levels.filter(
                (l) => l.subtopic?.toString() === subt._id.toString()
              )) {
                subtNode.levels[lvl._id.toString()] = {
                  _id: lvl._id,
                  name: lvl.name,
                  count: 0,
                  thisWeek: 0,
                  thisMonth: 0,
                  approved: 0,
                  approvedThisWeek: 0,
                  approvedThisMonth: 0,
                };
              }
            }
          }
        }
      }
    }

    const questions = await Question.find({
      creator: user._id,
      deletedAt: { $in: [null, undefined] },
    })
      .populate([
        { path: "review", select: "approved reviewedAt rating" },
        "enterprise class subject topic subtopic level",
      ])
      .lean();

    let questionCount = 0;
    let reviewedCount = 0;
    let approvedCount = 0;
    let unapprovedCount = 0;
    let totalRating = 0;
    let ratingCount = 0;

    for (const q of questions) {
      questionCount++;

      const isApproved = q.review?.approved && q.review?.reviewedAt;
      const createdAt = new Date(q.createdAt);
      const isThisWeek = createdAt >= startOfWeek;
      const isThisMonth = createdAt >= startOfMonth;

      if (q.review?.reviewedAt) {
        reviewedCount++;
        if (q.review.approved) approvedCount++;
        else unapprovedCount++;

        if (typeof q.review.rating === "number") {
          totalRating += q.review.rating;
          ratingCount++;
        }
      }

      const eId = q.enterprise?._id?.toString();
      const cId = q.class?._id?.toString();
      const sId = q.subject?._id?.toString();
      const tId = q.topic?._id?.toString();
      const stId = q.subtopic?._id?.toString();
      const lId = q.level?._id?.toString();

      const levelNode =
        tree[eId]?.classes[cId]?.subjects[sId]?.topics[tId]?.subtopics[stId]
          ?.levels[lId];
      if (levelNode) {
        // base counts
        levelNode.count++;
        if (isThisWeek) levelNode.thisWeek++;
        if (isThisMonth) levelNode.thisMonth++;
        if (isApproved) {
          levelNode.approved++;
          if (isThisWeek) levelNode.approvedThisWeek++;
          if (isThisMonth) levelNode.approvedThisMonth++;
        }

        const subt =
          tree[eId].classes[cId].subjects[sId].topics[tId].subtopics[stId];
        subt.count++;
        if (isThisWeek) subt.thisWeek++;
        if (isThisMonth) subt.thisMonth++;
        if (isApproved) {
          subt.approved++;
          if (isThisWeek) subt.approvedThisWeek++;
          if (isThisMonth) subt.approvedThisMonth++;
        }

        const top = tree[eId].classes[cId].subjects[sId].topics[tId];
        top.count++;
        if (isThisWeek) top.thisWeek++;
        if (isThisMonth) top.thisMonth++;
        if (isApproved) {
          top.approved++;
          if (isThisWeek) top.approvedThisWeek++;
          if (isThisMonth) top.approvedThisMonth++;
        }

        const subj = tree[eId].classes[cId].subjects[sId];
        subj.count++;
        if (isThisWeek) subj.thisWeek++;
        if (isThisMonth) subj.thisMonth++;
        if (isApproved) {
          subj.approved++;
          if (isThisWeek) subj.approvedThisWeek++;
          if (isThisMonth) subj.approvedThisMonth++;
        }

        const cls = tree[eId].classes[cId];
        cls.count++;
        if (isThisWeek) cls.thisWeek++;
        if (isThisMonth) cls.thisMonth++;
        if (isApproved) {
          cls.approved++;
          if (isThisWeek) cls.approvedThisWeek++;
          if (isThisMonth) cls.approvedThisMonth++;
        }

        const ent = tree[eId];
        ent.count++;
        if (isThisWeek) ent.thisWeek++;
        if (isThisMonth) ent.thisMonth++;
        if (isApproved) {
          ent.approved++;
          if (isThisWeek) ent.approvedThisWeek++;
          if (isThisMonth) ent.approvedThisMonth++;
        }
      }
    }

    const breakdown = Object.values(tree).map((ent) => ({
      _id: ent._id,
      name: ent.name,
      count: ent.count,
      thisWeek: ent.thisWeek,
      thisMonth: ent.thisMonth,
      approved: ent.approved,
      approvedThisWeek: ent.approvedThisWeek,
      approvedThisMonth: ent.approvedThisMonth,
      classes: Object.values(ent.classes).map((cls) => ({
        _id: cls._id,
        name: cls.name,
        count: cls.count,
        thisWeek: cls.thisWeek,
        thisMonth: cls.thisMonth,
        approved: cls.approved,
        approvedThisWeek: cls.approvedThisWeek,
        approvedThisMonth: cls.approvedThisMonth,
        subjects: Object.values(cls.subjects).map((subj) => ({
          _id: subj._id,
          name: subj.name,
          count: subj.count,
          thisWeek: subj.thisWeek,
          thisMonth: subj.thisMonth,
          approved: subj.approved,
          approvedThisWeek: subj.approvedThisWeek,
          approvedThisMonth: subj.approvedThisMonth,
          topics: Object.values(subj.topics).map((top) => ({
            _id: top._id,
            name: top.name,
            count: top.count,
            thisWeek: top.thisWeek,
            thisMonth: top.thisMonth,
            approved: top.approved,
            approvedThisWeek: top.approvedThisWeek,
            approvedThisMonth: top.approvedThisMonth,
            subtopics: Object.values(top.subtopics).map((subt) => ({
              _id: subt._id,
              name: subt.name,
              count: subt.count,
              thisWeek: subt.thisWeek,
              thisMonth: subt.thisMonth,
              approved: subt.approved,
              approvedThisWeek: subt.approvedThisWeek,
              approvedThisMonth: subt.approvedThisMonth,
              levels: Object.values(subt.levels),
            })),
          })),
        })),
      })),
    }));

    const averageRating =
      ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : null;

    return handleSuccess(
      res,
      {
        user,
        stats: {
          questionCount,
          reviewedCount,
          approvedCount,
          unapprovedCount,
          totalRating,
          ratingCount,
          averageRating,
        },
        breakdown,
      },
      "User profile fetched successfully",
      200
    );
  } catch (err) {
    console.error("User profile fetch error:", err);
    return handleError(res, err, "Failed to fetch user profile", 500);
  }
};
