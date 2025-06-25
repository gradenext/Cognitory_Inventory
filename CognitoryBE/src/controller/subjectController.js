import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import Enterprise from "../models/Enterprise.js";
import Class from "../models/Class.js";

export const createSubject = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { name, enterpriseId, classId } = req.body;

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
    if (!classId) {
      return res.status(403).json({
        success: false,
        message: "Class ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Enterprise ID",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Class ID",
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

    const classObject = await Class.findById(classId).session(session);
    if (!classObject) {
      return res.status(404).json({
        success: false,
        message: "Class does not exist",
      });
    }

    const [subject] = await Subject.create([{ name, enterpriseId, classId }], {
      session,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Create class error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create subject",
      error: err.message,
    });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate("enterpriseId")
      .populate("classId");
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate("enterpriseId")
      .populate("classId");
    if (!subject) return res.status(404).json({ error: "Not found" });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
