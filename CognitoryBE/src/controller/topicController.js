import mongoose from "mongoose";
import Class from "../models/Class.js";
import Enterprise from "../models/Enterprise.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";

export const createTopic = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { name, enterpriseId, classId, subjectId } = req.body;

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
    if (!subjectId) {
      return res.status(403).json({
        success: false,
        message: "Subject ID is required",
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
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subject ID",
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
    const subject = await Subject.findById(subjectId).session(session);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject does not exist",
      });
    }

    const [topic] = await Topic.create(
      [{ name, enterpriseId, classId, subjectId }],
      {
        session,
      }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      topic,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Create class error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create topic",
      error: err.message,
    });
  }
};

export const getAllTopics = async (req, res) => {
  try {
    const topics = await Topic.find()
      .populate("enterpriseId")
      .populate("classId")
      .populate("subjectId");
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate("enterpriseId")
      .populate("classId")
      .populate("subjectId");
    if (!topic) return res.status(404).json({ error: "Not found" });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(topic);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    await Topic.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
