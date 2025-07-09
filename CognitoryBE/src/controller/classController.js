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

    const createdClass = await session.withTransaction(async () => {
      await verifyModelReferences(refsToCheck, session);

      const [newClass] = await Class.create(
        [{ name, enterprise: enterpriseId }],
        { session }
      );

      await Enterprise.findByIdAndUpdate(
        enterpriseId,
        { $push: { classes: newClass._id } },
        { session }
      );

      return await Class.findById(newClass._id)
        .populate("enterprise", "name slug email image classes _id")
        .session(session);
    });

    return handleSuccess(
      res,
      createdClass,
      `Class added successfully to Enterprise ${createdClass?.enterprise?.name} `,
      201
    );
  } catch (err) {
    console.error("Create class error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        "Class with given name already exists in the Enterprise",
        409
      );
    }
    return handleError(res, err, "Failed to create class", 500);
  } finally {
    await session.endSession();
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const {
      enterpriseId,
      page = 1,
      limit = 10,
      paginate = "false",
      filterDeleted = "false",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const shouldPaginate = paginate === "true";
    const shouldFilterDeleted = filterDeleted === "true";

    let refsToCheck = [];
    let params = {};

    if (enterpriseId) {
      refsToCheck.push({
        model: Enterprise,
        id: enterpriseId,
        key: "Enterprise ID",
      });
      params.enterprise = enterpriseId;
    }

    if (shouldFilterDeleted) {
      params.deletedAt = null;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await verifyModelReferences(refsToCheck);

    const query = Class.find(params, "-slug -__v").populate(
      "enterprise",
      "_id name"
    );

    if (shouldPaginate) {
      query.skip(skip).limit(Number(limit));
    }

    const [classes, totalCount] = await Promise.all([
      query.exec(),
      Class.countDocuments(params),
    ]);

    return handleSuccess(
      res,
      {
        ...(shouldPaginate && {
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount / Number(limit)),
        }),
        total: totalCount,
        classes,
      },
      "Classes fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch classes error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    return handleError(res, err, "Failed to fetch classes", 500);
  }
};

export const getClassById = async (req, res) => {
  try {
    const { classId } = req.params;
    const { showDeleted = "false" } = req.query;
    const role = req?.user?.role || "user";
    const isSuper = role === "super";
    const allowDeleted = showDeleted === "true";

    const refsToCheck = [{ id: classId, key: "Class ID" }];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    let filter = { _id: classId };
    if (!isSuper && !allowDeleted) {
      filter.deletedAt = null;
    }

    const cls = await Class.findOne(filter, "-slug -__v");
    if (!cls) {
      return handleError(res, {}, "Class not found", 404);
    }

    return handleSuccess(res, cls, "Class fetched successfully", 200);
  } catch (err) {
    console.error(err);
    return handleError(res, err, "Failed to fetch class", 500);
  }
};

export const updateClass = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const { name, enterpriseId } = req.body;

    // Validate ID
    const refsToCheck = [
      { model: Class, id, key: "Class ID" },
      { model: Enterprise, id: enterpriseId, key: "Enterprise ID" },
    ];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

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

    const updatedClass = await session.withTransaction(async () => {
      const existingClass = await Class.findById(id).session(session);
      if (!existingClass) {
        throw new Error("Class not found");
      }

      await verifyModelReferences(refsToCheck, session);

      // If enterprise is changing, update enterprise references
      if (existingClass.enterprise.toString() !== enterpriseId) {
        await Enterprise.findByIdAndUpdate(
          existingClass.enterprise,
          { $pull: { classes: id } },
          { session }
        );
        await Enterprise.findByIdAndUpdate(
          enterpriseId,
          { $addToSet: { classes: id } },
          { session }
        );
      }

      // Update the class itself
      await Class.findByIdAndUpdate(
        id,
        { name, enterprise: enterpriseId },
        { new: true, runValidators: true, session }
      );

      return await Class.findById(id, "-slug -__v")
        .populate("enterprise", "name email image classes _id")
        .session(session);
    });

    return handleSuccess(res, updatedClass, `Class updated successfully`, 200);
  } catch (err) {
    console.error("Update class error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        "Another class with this name already exists in the Enterprise",
        409
      );
    }
    return handleError(res, err, "Failed to update class", 500);
  } finally {
    await session.endSession();
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
