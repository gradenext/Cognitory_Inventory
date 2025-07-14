import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import Enterprise from "../models/Enterprise.js";
import Class from "../models/Class.js";
import isValidMongoId from "../helper/isMongoId.js";
import { validateWithZod } from "../validations/validate.js";
import { subjectSchema } from "../validations/subject.js";
import handleSuccess from "../helper/handleSuccess.js";
import handleError from "../helper/handleError.js";
import { verifyModelReferences } from "../helper/referenceCheck.js";
import { z } from "zod";

export const createSubject = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { name, enterpriseId, classId } = req.body;

    const validationResult = validateWithZod(subjectSchema, {
      name,
      enterpriseId,
      classId,
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
      { model: Class, id: classId, key: "Class ID" },
    ];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const createdSubject = await session.withTransaction(async () => {
      await verifyModelReferences(refsToCheck, session);

      const [subject] = await Subject.create(
        [{ name, enterprise: enterpriseId, class: classId }],
        { session }
      );

      await Class.findByIdAndUpdate(
        classId,
        { $push: { subjects: subject._id } },
        { session }
      );

      return await Subject.findById(subject._id)
        .populate("class", "name slug email image subjects _id")
        .session(session);
    });

    return handleSuccess(
      res,
      createdSubject,
      `Subject added successfully to class ${createdSubject?.class?.name}`,
      201
    );
  } catch (err) {
    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        "Subject with given name already exists in the class",
        409
      );
    }

    console.error("Create subject error:", err);
    return handleError(res, err, "Failed to create subject", 500);
  } finally {
    await session.endSession();
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const {
      enterpriseId,
      classId,
      page = 1,
      limit = 10,
      paginate = "false",
      filterDeleted = "true",
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

    if (classId) {
      refsToCheck.push({ model: Class, id: classId, key: "Class ID" });
      params.class = classId;
    }

    if (shouldFilterDeleted) {
      params.deletedAt = null;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    await verifyModelReferences(refsToCheck);

    const query = Subject.find(params, "-slug -__v").populate([
      { path: "enterprise", select: "_id name" },
      { path: "class", select: "_id name" },
    ]);

    if (shouldPaginate) {
      query.skip(skip).limit(Number(limit));
    }

    const [subjects, totalCount] = await Promise.all([
      query.exec(),
      Subject.countDocuments(params),
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
        subjects,
      },
      "Subjects fetched successfully",
      200
    );
  } catch (err) {
    console.error("Fetch subjects error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }
    return handleError(res, err, "Failed to fetch subjects", 500);
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { showDeleted = "false" } = req.query;
    const role = req?.user?.role || "user";
    const isSuper = role === "super";
    const allowDeleted = showDeleted === "true";

    const refsToCheck = [{ id: subjectId, key: "Subject ID" }];
    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    let filter = { _id: subjectId };
    if (!isSuper && !allowDeleted) {
      filter.deletedAt = null;
    }

    const subject = await Subject.findOne(filter, "-slug -__v");
    if (!subject) return handleError(res, {}, "Subject Not found", 404);

    return handleSuccess(res, subject, "Subject fetched successfully", 200);
  } catch (err) {
    console.error("Fetch subject by ID error:", err);
    return handleError(res, err, "Failed to fetch subject", 500);
  }
};

export const softUpdateSubjectName = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { subjectId } = req.params;
    const { name } = req.body;
    const { role } = req.user;

    // Validate name using inline schema
    const validationResult = validateWithZod(
      z.object({
        name: z.string().min(1, "Name is required"),
        subjectId: z.string().min(1, "Subject Id is required"),
      }),
      { name, subjectId }
    );

    if (!validationResult.success) {
      return handleError(
        res,
        { errors: validationResult.errors },
        "Validation Error",
        406
      );
    }

    // Validate ID
    const invalidIds = isValidMongoId([{ id: subjectId, key: "Subject ID" }]);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const updatedSubject = await session.withTransaction(async () => {
      const existingSubject = await Subject.findById(subjectId).session(
        session
      );
      if (!existingSubject) {
        throw new Error("Subject not found");
      }

      if (existingSubject.deletedAt && role !== "super") {
        throw new Error("Subject not found");
      }

      await Subject.findByIdAndUpdate(
        subjectId,
        { name },
        { new: true, runValidators: true, session }
      );

      return await Subject.findById(subjectId, " -__v")
        .populate("class", "name slug email image subjects _id")
        .session(session);
    });

    return handleSuccess(
      res,
      updatedSubject,
      "Subject name updated successfully",
      200
    );
  } catch (err) {
    console.error("Soft update subject name error:", err);

    if (err.message?.includes("not found")) {
      return handleError(res, {}, err.message, 404);
    }

    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(
        res,
        {},
        "Another subject with this name already exists in the class",
        409
      );
    }

    return handleError(res, err, "Failed to update subject name", 500);
  } finally {
    await session.endSession();
  }
};
