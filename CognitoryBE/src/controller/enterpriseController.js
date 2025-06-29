import mongoose from "mongoose";
import Enterprise from "../models/Enterprise.js";
import { validateWithZod } from "../validations/validate.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import isValidMongoId from "../helper/isMongoId.js";
import { enterpriseSchema } from "../validations/enterprise.js";

export const createEnterprise = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const { name, email } = req.body;

    const validationResult = validateWithZod(enterpriseSchema, { name, email });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    // Start transaction
    await session.startTransaction();
    transactionStarted = true;

    const [enterprise] = await Enterprise.create(
      [
        {
          name,
          email,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    transactionStarted = false;

    return handleSuccess(
      res,
      enterprise,
      "Enterprise created successfully",
      201
    );
  } catch (err) {
    if (transactionStarted) {
      await session.abortTransaction();
    }

    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        `Duplicate Enterprise name, use a different name`,
        409
      );
    } else {
      console.error("Create enterprise error:", err);
      return handleError(res, err, "Failed to create enterprise", 500);
    }
  } finally {
    await session.endSession();
  }
};

export const getAllEnterprises = async (req, res) => {
  try {
    const enterprises = await Enterprise.find();

    return handleSuccess(
      res,
      { enterprises },
      "Enterprises fetched successfully",
      201
    );
  } catch (err) {
    return handleError(res, err, "Failed to fetch enterprise", 500);
  }
};

export const getEnterpriseById = async (req, res) => {
  try {
    const { enterpriseId } = req.params;

    const refsToCheck = [
      { model: Enterprise, id: enterpriseId, key: "Enterprise ID" },
    ];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const enterprise = await Enterprise.findById(enterpriseId);

    if (!enterprise) return handleError(res, {}, "Enterprise Not found", 404);

    return handleSuccess(
      res,
      enterprise,
      "Enterprise fetched successfully",
      201
    );
  } catch (err) {
    return handleError(res, err, "Failed to fetch enterprise", 500);
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
