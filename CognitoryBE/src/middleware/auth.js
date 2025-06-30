// middlewares/auth.ts
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import dotenv from "dotenv";
import handleError from "../helper/handleError.js";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return handleError(res, {}, `Token Missing`, 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return handleError(res, err, "Invalid or expired token", 401);
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const userDetails = await User.findOne({ _id: req.user.userId });
    if (userDetails.role !== "super" && userDetails.role !== "admin") {
      return handleError(
        res,
        {},
        "This is a Protected Route for Admin and Super Admin",
        401
      );
    }
    next();
  } catch (error) {
    console.log(error);

    return handleError(res, {}, "User Role Can't be Verified", 500);
  }
};

export const isSuper = async (req, res, next) => {
  try {
    const userDetails = await User.findOne({ _id: req.user.userId });
    if (userDetails.role !== "super") {
      return handleError(
        res,
        {},
        "This is a Protected Route for Super Admin",
        401
      );
    }
    next();
  } catch (error) {
    console.log(error);

    return handleError(res, {}, "User Role Can't be Verified", 500);
  }
};
