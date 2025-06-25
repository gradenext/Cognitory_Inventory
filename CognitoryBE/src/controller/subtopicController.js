import Subtopic from "../models/Subtopic.js";

export const createSubtopic = async (req, res) => {
  try {
    const subtopic = new Subtopic(req.body);
    await subtopic.save();
    res.status(201).json(subtopic);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllSubtopics = async (req, res) => {
  try {
    const subtopics = await Subtopic.find()
      .populate("enterpriseId")
      .populate("classId")
      .populate("subjectId")
      .populate("topicId");
    res.json(subtopics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubtopicById = async (req, res) => {
  try {
    const subtopic = await Subtopic.findById(req.params.id)
      .populate("enterpriseId")
      .populate("classId")
      .populate("subjectId")
      .populate("topicId");
    if (!subtopic) return res.status(404).json({ error: "Not found" });
    res.json(subtopic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSubtopic = async (req, res) => {
  try {
    const subtopic = await Subtopic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(subtopic);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteSubtopic = async (req, res) => {
  try {
    await Subtopic.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
