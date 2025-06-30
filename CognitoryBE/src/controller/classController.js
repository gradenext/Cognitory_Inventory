import mongoose from "mongoose";
import Class from "../models/Class.js";
import Enterprise from "../models/Enterprise.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import isValidMongoId from "../helper/isMongoId.js";
import handleSuccess from "../helper/handleSuccess.js";
import handleError from "../helper/handleError.js";
import { validateWithZod } from "../validations/validate.js";
import { classSchema } from "../validations/class.js";

export const createClass = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const { name, enterpriseId } = req.body;

    const validationResult = validateWithZod(classSchema, {
      name,
      enterpriseId,
    });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    const refsToCheck = [
      { model: Enterprise, id: enterpriseId, key: "Enterprise ID" },
    ];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await session.startTransaction();
    transactionStarted = true;

    const notExistIds = await verifyModelReferences(session, refsToCheck);
    if (notExistIds.length > 0) {
      if (transactionStarted) {
        await session.abortTransaction();
      }
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const [newClass] = await Class.create(
      [{ name, enterprise: enterpriseId }],
      {
        session,
      }
    );

    // Push new class ID into Enterprise's classIds array
    await Enterprise.findByIdAndUpdate(
      enterpriseId,
      { $push: { classes: newClass._id } },
      { session }
    );

    const populatedClass = await Class.findById(newClass._id)
      .populate("enterprise", "name slug email image classes _id")
      .session(session);

    await session.commitTransaction();
    transactionStarted = false;

    return handleSuccess(
      res,
      populatedClass,
      `Class added successfully to Enterprise ${populatedClass?.enterprise?.name}`,
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
        `Class with given name already exist in the Enterprise`,
        409
      );
    } else {
      console.error("Create class error:", err);
      return handleError(res, err, "Failed to create class", 500);
    }
  } finally {
    await session.endSession();
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const { enterpriseId, page = 1, limit = 10, paginate = "true" } = req.query;
    const skip = (page - 1) * limit;
    const shouldPaginate = paginate === "true";

    let refsToCheck = [];
    let params = {};

    if (enterpriseId) {
      refsToCheck.push({
        model: Enterprise,
        id: enterpriseId,
        key: "Enterprise ID",
      });

      params["enterprise"] = enterpriseId;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const notExistIds = await verifyModelReferences(refsToCheck);
    if (notExistIds.length > 0) {
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const query = Class.find(params, "-slug -__v");

    if (shouldPaginate) {
      query.skip(skip).limit(limit);
    }

    const classes = await query.exec();
    const totalCount = await Class.countDocuments(params);

    return handleSuccess(
      res,
      {
        ...(shouldPaginate && {
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount / limit),
        }),
        total: totalCount,
        classes,
      },
      "Classes fetched successfully",
      200
    );
  } catch (err) {
    console.log(err);
    return handleError(res, err, "Failed to fetch classes", 500);
  }
};

export const getClassById = async (req, res) => {
  try {
    const id = req.params.classId;

    const refsToCheck = [{ id: id, key: "Class ID" }];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const cls = await Class.findById(id, "-slug -__v");
    if (!cls) return handleError(res, {}, "Class Not found", 404);
    return handleSuccess(res, cls, "Class fetched successfully", 200);
  } catch (err) {
    console.log(err);
    return handleError(res, err, "Failed to fetch class", 500);
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
