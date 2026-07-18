import Course from "../models/Course.js";
import CourseAssignment from "../models/CourseAssignment.js";
import { validateWithZod } from "../validations/validate.js";
import { assignmentSchema, updateAssignmentSchema } from "../validations/assignment.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import isValidMongoId from "../helper/isMongoId.js";
import { uploadCourseFile } from "../utils/courseUpload.js";

export const createAssignment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, order } = req.body;

    const invalid = isValidMongoId([{ id: courseId, key: "Course ID" }]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const validation = validateWithZod(assignmentSchema, {
      title, courseId, description,
      order: order !== undefined ? Number(order) : undefined,
    });
    if (!validation.success) return handleError(res, { errors: validation.errors }, "Validation Error", 406);

    const course = await Course.findOne({ _id: courseId, deletedAt: null });
    if (!course) return handleError(res, {}, "Course not found", 404);

    const assignment = await CourseAssignment.create({
      course: courseId, title, description,
      order: order !== undefined ? Number(order) : 0,
    });

    return handleSuccess(res, assignment, "Assignment created successfully", 201);
  } catch (err) {
    console.error("Create assignment error:", err);
    return handleError(res, err, "Failed to create assignment", 500);
  }
};

export const getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { filterDeleted = "true" } = req.query;

    const invalid = isValidMongoId([{ id: courseId, key: "Course ID" }]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const params = { course: courseId };
    if (filterDeleted === "true") params.deletedAt = null;

    const assignments = await CourseAssignment.find(params, "-__v").sort({ order: 1 });
    return handleSuccess(res, { total: assignments.length, assignments }, "Assignments fetched successfully");
  } catch (err) {
    console.error("Get assignments error:", err);
    return handleError(res, err, "Failed to fetch assignments", 500);
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { courseId, assignmentId } = req.params;
    const { title, description, order } = req.body;

    const invalid = isValidMongoId([
      { id: courseId, key: "Course ID" },
      { id: assignmentId, key: "Assignment ID" },
    ]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const validation = validateWithZod(updateAssignmentSchema, {
      title, description,
      order: order !== undefined ? Number(order) : undefined,
    });
    if (!validation.success) return handleError(res, { errors: validation.errors }, "Validation Error", 406);

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (order !== undefined) updates.order = Number(order);

    const assignment = await CourseAssignment.findOneAndUpdate(
      { _id: assignmentId, course: courseId, deletedAt: null },
      updates,
      { new: true, runValidators: true }
    );
    if (!assignment) return handleError(res, {}, "Assignment not found", 404);

    return handleSuccess(res, assignment, "Assignment updated successfully");
  } catch (err) {
    console.error("Update assignment error:", err);
    return handleError(res, err, "Failed to update assignment", 500);
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const { courseId, assignmentId } = req.params;

    const invalid = isValidMongoId([
      { id: courseId, key: "Course ID" },
      { id: assignmentId, key: "Assignment ID" },
    ]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const assignment = await CourseAssignment.findOneAndUpdate(
      { _id: assignmentId, course: courseId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!assignment) return handleError(res, {}, "Assignment not found", 404);

    return handleSuccess(res, {}, "Assignment deleted successfully");
  } catch (err) {
    console.error("Delete assignment error:", err);
    return handleError(res, err, "Failed to delete assignment", 500);
  }
};

export const publishAssignment = async (req, res) => {
  try {
    const { courseId, assignmentId } = req.params;

    const invalid = isValidMongoId([
      { id: courseId, key: "Course ID" },
      { id: assignmentId, key: "Assignment ID" },
    ]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const assignment = await CourseAssignment.findOneAndUpdate(
      { _id: assignmentId, course: courseId, deletedAt: null },
      { status: "published" },
      { new: true }
    );
    if (!assignment) return handleError(res, {}, "Assignment not found", 404);

    const course = await Course.findById(courseId);

    const syncPayload = {
      cognitory_id: assignment._id.toString(),
      course_cognitory_id: courseId,
      title: assignment.title,
      description: assignment.description,
      order: assignment.order,
      file: assignment.file,
      status: "published",
    };

    const gradeNextUrl = process.env.GRADENEXT_API_URL;
    const syncSecret = process.env.GRADENEXT_SYNC_SECRET;
    if (gradeNextUrl && syncSecret) {
      fetch(`${gradeNextUrl}/api/assignments/sync/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sync-Secret": syncSecret,
        },
        body: JSON.stringify(syncPayload),
      }).catch((err) => {
        console.error("GradeNext assignment sync failed (non-fatal):", err.message);
      });
    }

    return handleSuccess(res, assignment, "Assignment published successfully");
  } catch (err) {
    console.error("Publish assignment error:", err);
    return handleError(res, err, "Failed to publish assignment", 500);
  }
};

export const resyncCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const invalid = isValidMongoId([{ id: courseId, key: "Course ID" }]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const assignments = await CourseAssignment.find({ course: courseId, deletedAt: null, status: "published" });
    if (!assignments.length) return handleSuccess(res, { synced: 0 }, "No published assignments to sync");

    const gradeNextUrl = process.env.GRADENEXT_API_URL;
    const syncSecret = process.env.GRADENEXT_SYNC_SECRET;
    if (!gradeNextUrl || !syncSecret) return handleError(res, {}, "GradeNext sync env vars not configured", 500);

    const results = await Promise.allSettled(
      assignments.map((a) =>
        fetch(`${gradeNextUrl}/api/assignments/sync/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Sync-Secret": syncSecret },
          body: JSON.stringify({
            cognitory_id: a._id.toString(),
            course_cognitory_id: courseId,
            title: a.title,
            description: a.description,
            order: a.order,
            file: a.file,
            status: a.status,
          }),
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    return handleSuccess(res, { synced: succeeded, total: assignments.length }, `Re-synced ${succeeded}/${assignments.length} assignments`);
  } catch (err) {
    console.error("Resync assignments error:", err);
    return handleError(res, err, "Failed to re-sync assignments", 500);
  }
};

export const uploadAssignmentFile = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const invalid = isValidMongoId([{ id: assignmentId, key: "Assignment ID" }]);
    if (invalid.length > 0) return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);

    const assignment = await CourseAssignment.findOne({ _id: assignmentId, deletedAt: null });
    if (!assignment) return handleError(res, {}, "Assignment not found", 404);

    if (!req.files?.file) return handleError(res, {}, "No file provided", 400);

    const file = req.files.file;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "ppt", "pptx"].includes(ext)) {
      return handleError(res, {}, "Only PDF, PPT, and PPTX files are allowed", 400);
    }

    const course = await Course.findById(assignment.course);
    const folderPath = `Cognitory/assignments/${course?.slug || assignment.course.toString()}`;
    const publicId = `assignment_${assignmentId}_${Date.now()}`;

    const result = await uploadCourseFile(file.tempFilePath, publicId, folderPath, ext);

    const updated = await CourseAssignment.findByIdAndUpdate(
      assignmentId,
      {
        file: {
          url: result.secure_url,
          publicId: result.public_id,
          fileType: ext,
          originalName: file.name,
        },
      },
      { new: true }
    );

    // Sync to GradeNext whenever a file is uploaded (regardless of publish status)
    const gradeNextUrl = process.env.GRADENEXT_API_URL;
    const syncSecret = process.env.GRADENEXT_SYNC_SECRET;
    if (gradeNextUrl && syncSecret) {
      const syncPayload = {
        cognitory_id: updated._id.toString(),
        course_cognitory_id: updated.course.toString(),
        title: updated.title,
        description: updated.description,
        order: updated.order,
        file: updated.file,
        status: updated.status,
      };
      fetch(`${gradeNextUrl}/api/assignments/sync/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sync-Secret": syncSecret,
        },
        body: JSON.stringify(syncPayload),
      }).catch((err) => {
        console.error("GradeNext assignment sync after file upload failed (non-fatal):", err.message);
      });
    }

    return handleSuccess(res, updated, "File uploaded successfully");
  } catch (err) {
    console.error("Upload assignment file error:", err);
    return handleError(res, err, "Failed to upload file", 500);
  }
};
