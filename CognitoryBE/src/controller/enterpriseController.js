import mongoose from "mongoose";
import Enterprise from "../models/Enterprise.js";

export const createEnterprise = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { name } = req.body;

    if (!name) {
      return res.status(403).json({
        success: false,
        message: "Enterprise name is required",
      });
    }

    session.startTransaction();

    const [enterprise] = await Enterprise.create([{ name }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Enterprise created successfully",
      enterprise,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Create enterprise error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create enterprise",
      error: err.message,
    });
  }
};

export const getAllEnterprises = async (req, res) => {
  try {
    const enterprises = await Enterprise.find();
    res.json(enterprises);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEnterpriseById = async (req, res) => {
  try {
    const enterprise = await Enterprise.findById(req.params.id);
    if (!enterprise) return res.status(404).json({ error: "Not found" });
    res.json(enterprise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEnterprise = async (req, res) => {
  try {
    const enterprise = await Enterprise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(enterprise);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteEnterprise = async (req, res) => {
  try {
    await Enterprise.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
