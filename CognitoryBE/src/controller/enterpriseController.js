import mongoose from "mongoose";
import Enterprise from "../models/Enterprise.js";
import { validateWithZod } from "../validations/validate.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import isValidMongoId from "../helper/isMongoId.js";
import { enterpriseSchema } from "../validations/enterprise.js";
import { getPaginationMeta } from "../helper/getPaginationMeta.js";

export const createEnterprise = async (req, res) => {
  const session = await mongoose.startSession();

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

    const enterprise = await session.withTransaction(async () => {
      const [created] = await Enterprise.create([{ name, email }], {
        session,
      });

      return created;
    });

    return handleSuccess(
      res,
      enterprise,
      "Enterprise created successfully",
      201
    );
  } catch (err) {
    console.error("Create enterprise error:", err);

    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        "Duplicate Enterprise name, use a different name",
        409
      );
    }

    return handleError(res, err, "Failed to create enterprise", 500);
  } finally {
    await session.endSession();
  }
};

export const getAllEnterprises = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      paginate = "false",
      filterDeleted = "true",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const shouldPaginate = paginate === "true";
    const shouldFilterDeleted = filterDeleted === "true";

    let params = {};
    if (shouldFilterDeleted) {
      params.deletedAt = null;
    }

    const query = Enterprise.find(params, "-slug -__v");
    if (shouldPaginate) {
      query.skip(skip).limit(Number(limit));
    }

    const [enterprises, totalCount] = await Promise.all([
      query.exec(),
      Enterprise.countDocuments(params),
    ]);

    return handleSuccess(
      res,
      {
        ...(shouldPaginate &&
          getPaginationMeta({
            page,
            limit,
            totalItems: totalCount,
          })),
        total: totalCount,
        enterprises,
      },
      "Enterprises fetched successfully",
      200
    );
  } catch (err) {
    console.error(err);
    return handleError(res, err, "Failed to fetch enterprises", 500);
  }
};

export const getEnterpriseById = async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const { showDeleted = "false" } = req.query;

    const role = req?.user?.role || "user";
    const isSuper = role === "super";
    const allowDeleted = showDeleted === "true";

    const refsToCheck = [{ id: enterpriseId, key: "Enterprise ID" }];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    let filter = { _id: enterpriseId };
    if (!isSuper && !allowDeleted) {
      filter.deletedAt = null;
    }

    const enterprise = await Enterprise.findOne(filter, "-slug -__v");
    if (!enterprise) {
      return handleError(res, {}, "Enterprise not found", 404);
    }

    return handleSuccess(
      res,
      enterprise,
      "Enterprise fetched successfully",
      200
    );
  } catch (err) {
    console.error(err);
    return handleError(res, err, "Failed to fetch enterprise", 500);
  }
};

export const updateEnterprise = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { enterpriseId } = req.params;
    const { name, email } = req.body;
    const { role } = req.user;

    if (!enterpriseId) {
      return handleError(res, {}, "Enterprise ID is required", 400);
    }

    // Step 1: Validate input using Zod
    const validationResult = validateWithZod(enterpriseSchema, { name, email });
    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    // Step 2: Validate enterprise ID
    const invalidIds = isValidMongoId([
      { id: enterpriseId, key: "Enterprise ID" },
    ]);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    // Step 3: Main logic in transaction
    const updatedEnterprise = await session.withTransaction(async () => {
      const existingEnterprise = await Enterprise.findById(
        enterpriseId
      ).session(session);

      if (!existingEnterprise) {
        throw new Error("Enterprise not found");
      }

      // Step 4: Soft-delete check
      if (existingEnterprise.deletedAt && role !== "super") {
        throw new Error("Enterprise not found");
      }

      // Step 5: Update
      await Enterprise.findByIdAndUpdate(
        enterpriseId,
        { name, email },
        { new: true, runValidators: true, session }
      );

      return await Enterprise.findById(enterpriseId, "-__v ").session(session);
    });

    // Step 6: Return response
    return handleSuccess(
      res,
      updatedEnterprise,
      "Enterprise updated successfully",
      200
    );
  } catch (err) {
    console.error("Update enterprise error:", err);

    // Step 7: Handle duplicate and standard errors
    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }

    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        "Another enterprise with this name or email already exists",
        409
      );
    }

    return handleError(res, err, "Failed to update enterprise", 500);
  } finally {
    await session.endSession();
  }
};
