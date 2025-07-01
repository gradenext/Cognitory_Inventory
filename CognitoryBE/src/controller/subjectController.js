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

export const createSubject = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

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

    session.startTransaction();
    transactionStarted = true;

    const notExistIds = await verifyModelReferences(refsToCheck, session);
    if (notExistIds.length > 0) {
      if (transactionStarted) {
        await session.abortTransaction();
      }
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const [subject] = await Subject.create(
      [{ name, enterprise: enterpriseId, class: classId }],
      { session }
    );

    await Class.findByIdAndUpdate(
      classId,
      { $push: { subjects: subject._id } },
      { session }
    );

    const populatedSubject = await Subject.findById(subject._id)
      .populate("class", "name slug email image subjects _id")
      .session(session);

    await session.commitTransaction();

    transactionStarted = false;

    return handleSuccess(
      res,
      populatedSubject,
      `Subject added successfully to class ${populatedSubject?.class?.name}`,
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
        `Subject with given name already exists in the class`,
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
      paginate = "true",
    } = req.query;
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

    if (classId) {
      refsToCheck.push({
        model: Class,
        id: classId,
        key: "Class ID",
      });

      params["class"] = classId;
    }

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const notExistIds = await verifyModelReferences(refsToCheck);
    if (notExistIds.length > 0) {
      return handleError(res, {}, `${notExistIds.join(", ")} not found`, 404);
    }

    const query = Subject.find(params, "-slug -__v");

    if (shouldPaginate) {
      query.skip(skip).limit(limit);
    }

    const subjects = await query.exec();
    const totalCount = await Subject.countDocuments(params);

    return handleSuccess(
      res,
      {
        ...(shouldPaginate && {
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount / limit),
        }),
        total: totalCount,
        subjects,
      },
      "Subjects fetched successfully",
      200
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const refsToCheck = [{ id: subjectId, key: "Subject ID" }];

    const invalidIds = isValidMongoId(refsToCheck);
    if (invalidIds.length > 0) {
      return handleError(res, {}, `Invalid ${invalidIds.join(", ")}`, 406);
    }

    const subject = await Subject.findById(subjectId, "-slug -__v");

    if (!subject) return handleError(res, {}, "Subject Not found", 404);
    return handleSuccess(res, subject, "Subject fetched successfully", 200);
  } catch (err) {
    console.log(err);
    return handleError(res, err, "Failed to fetch subject", 500);
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
