import Level from "../models/Level.js";

export const createLevel = async (req, res) => {
  try {
    const level = new Level(req.body);
    await level.save();
    res.status(201).json(level);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllLevels = async (req, res) => {
  try {
    const levels = await Level.find()
      .populate("enterpriseId")
      .populate("classId")
      .populate("subjectId")
      .populate("topicId")
      .populate("subtopicId");
    res.json(levels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLevelById = async (req, res) => {
  try {
    const level = await Level.findById(req.params.id)
      .populate("enterpriseId classId subjectId topicId subtopicId");
    if (!level) return res.status(404).json({ error: "Not found" });
    res.json(level);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLevel = async (req, res) => {
  try {
    const updated = await Level.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteLevel = async (req, res) => {
  try {
    await Level.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
