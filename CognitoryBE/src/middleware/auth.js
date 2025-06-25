// middlewares/auth.ts
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: `Token Missing` });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const userDetails = await User.findOne({ _id: req.user.userId });
    if (userDetails.role !== "super" && userDetails.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "This is a Protected Route for Admin and Super Admin",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: `User Role Can't be Verified` });
  }
};
