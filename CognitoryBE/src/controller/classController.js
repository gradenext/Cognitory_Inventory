import mongoose from "mongoose";
import Class from "../models/Class.js";
import Enterprise from "../models/Enterprise.js";

export const createClass = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { name, enterpriseId } = req.body;

    if (!name) {
      return res.status(403).json({
        success: false,
        message: "Class name is required",
      });
    }

    if (!enterpriseId) {
      return res.status(403).json({
        success: false,
        message: "Enterprise ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Enterprise ID",
      });
    }

    session.startTransaction();

    const enterprise = await Enterprise.findById(enterpriseId).session(session);
    if (!enterprise) {
      return res.status(404).json({
        success: false,
        message: "Enterprise does not exist",
      });
    }

    const [newClass] = await Class.create([{ name, enterpriseId }], {
      session,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Create class error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create class",
      error: err.message,
    });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate("enterpriseId");
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getClassById = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).populate("enterpriseId");
    if (!cls) return res.status(404).json({ error: "Not found" });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const updated = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
