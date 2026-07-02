import mongoose from "mongoose";
import Course from "../models/Course.js";
import CourseModule from "../models/CourseModule.js";
import CourseLesson from "../models/CourseLesson.js";
import { validateWithZod } from "../validations/validate.js";
import {
  courseSchema,
  updateCourseSchema,
  moduleSchema,
  updateModuleSchema,
  lessonSchema,
  updateLessonSchema,
} from "../validations/course.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import isValidMongoId from "../helper/isMongoId.js";
import { uploadCourseFile } from "../utils/courseUpload.js";

// ─── Course CRUD ────────────────────────────────────────────────────────────

export const createCourse = async (req, res) => {
  try {
    const { title, type, description, order } = req.body;

    const validation = validateWithZod(courseSchema, { title, type, description, order: order ? Number(order) : undefined });
    if (!validation.success) {
      return handleError(res, { errors: validation.errors }, "Validation Error", 406);
    }

    const course = await Course.create({
      title,
      type,
      description,
      order: order ? Number(order) : 0,
      createdBy: req.user.userId,
    });

    return handleSuccess(res, course, "Course created successfully", 201);
  } catch (err) {
    if (err.name === "MongoServerError" && err.code === 11000) {
      return handleError(res, {}, "Course with this title already exists", 409);
    }
    console.error("Create course error:", err);
    return handleError(res, err, "Failed to create course", 500);
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const { type, status, filterDeleted = "true" } = req.query;
    const params = {};
    if (filterDeleted === "true") params.deletedAt = null;
    if (type) params.type = type;
    if (status) params.status = status;

    const courses = await Course.find(params, "-__v")
      .populate("createdBy", "name email")
      .sort({ order: 1, createdAt: -1 });

    return handleSuccess(res, { total: courses.length, courses }, "Courses fetched successfully");
  } catch (err) {
    console.error("Get all courses error:", err);
    return handleError(res, err, "Failed to fetch courses", 500);
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const invalid = isValidMongoId([{ id: courseId, key: "Course ID" }]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const course = await Course.findOne({ _id: courseId, deletedAt: null }, "-__v");
    if (!course) return handleError(res, {}, "Course not found", 404);

    const modules = await CourseModule.find({ course: courseId, deletedAt: null }, "-__v")
      .sort({ order: 1 })
      .lean();

    const moduleIds = modules.map((m) => m._id);
    const lessons = await CourseLesson.find(
      { module: { $in: moduleIds }, deletedAt: null },
      "-__v"
    ).sort({ order: 1 }).lean();

    const modulesWithLessons = modules.map((mod) => ({
      ...mod,
      lessons: lessons.filter((l) => l.module.toString() === mod._id.toString()),
    }));

    return handleSuccess(res, { course, modules: modulesWithLessons }, "Course fetched successfully");
  } catch (err) {
    console.error("Get course by ID error:", err);
    return handleError(res, err, "Failed to fetch course", 500);
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, type, description, order, status } = req.body;

    const invalid = isValidMongoId([{ id: courseId, key: "Course ID" }]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const validation = validateWithZod(updateCourseSchema, {
      title,
      type,
      description,
      order: order !== undefined ? Number(order) : undefined,
      status,
    });
    if (!validation.success) {
      return handleError(res, { errors: validation.errors }, "Validation Error", 406);
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (type !== undefined) updates.type = type;
    if (description !== undefined) updates.description = description;
    if (order !== undefined) updates.order = Number(order);
    if (status !== undefined) updates.status = status;

    const course = await Course.findOneAndUpdate(
      { _id: courseId, deletedAt: null },
      updates,
      { new: true, runValidators: true }
    );
    if (!course) return handleError(res, {}, "Course not found", 404);

    return handleSuccess(res, course, "Course updated successfully");
  } catch (err) {
    console.error("Update course error:", err);
    return handleError(res, err, "Failed to update course", 500);
  }
};

export const deleteCourse = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { courseId } = req.params;

    const invalid = isValidMongoId([{ id: courseId, key: "Course ID" }]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    await session.withTransaction(async () => {
      const course = await Course.findOne({ _id: courseId, deletedAt: null }).session(session);
      if (!course) throw new Error("Course not found");

      const now = new Date();
      await Course.findByIdAndUpdate(courseId, { deletedAt: now }, { session });
      await CourseModule.updateMany({ course: courseId, deletedAt: null }, { deletedAt: now }, { session });
      await CourseLesson.updateMany({ course: courseId, deletedAt: null }, { deletedAt: now }, { session });
    });

    return handleSuccess(res, {}, "Course deleted successfully");
  } catch (err) {
    if (err.message === "Course not found") {
      return handleError(res, {}, "Course not found", 404);
    }
    console.error("Delete course error:", err);
    return handleError(res, err, "Failed to delete course", 500);
  } finally {
    await session.endSession();
  }
};

export const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const invalid = isValidMongoId([{ id: courseId, key: "Course ID" }]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const course = await Course.findOneAndUpdate(
      { _id: courseId, deletedAt: null },
      { status: "published" },
      { new: true }
    );
    if (!course) return handleError(res, {}, "Course not found", 404);

    // Fetch modules and lessons to sync to GradeNext
    const modules = await CourseModule.find({ course: courseId, deletedAt: null }).sort({ order: 1 }).lean();
    const moduleIds = modules.map((m) => m._id);
    const lessons = await CourseLesson.find({ module: { $in: moduleIds }, deletedAt: null }).sort({ order: 1 }).lean();

    const modulesWithLessons = modules.map((mod) => ({
      cognitory_id: mod._id.toString(),
      title: mod.title,
      description: mod.description,
      order: mod.order,
      lessons: lessons
        .filter((l) => l.module.toString() === mod._id.toString())
        .map((l) => ({
          cognitory_id: l._id.toString(),
          title: l.title,
          description: l.description,
          order: l.order,
          file: l.file,
        })),
    }));

    const syncPayload = {
      cognitory_id: course._id.toString(),
      title: course.title,
      slug: course.slug,
      description: course.description,
      course_type: course.type,
      thumbnail_url: course.thumbnail?.url || "",
      order: course.order,
      modules: modulesWithLessons,
    };

    // Push to GradeNext — fire and forget, don't fail if it errors
    const gradeNextUrl = process.env.GRADENEXT_API_URL;
    const syncSecret = process.env.GRADENEXT_SYNC_SECRET;
    if (gradeNextUrl && syncSecret) {
      fetch(`${gradeNextUrl}/api/courses/sync/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sync-Secret": syncSecret,
        },
        body: JSON.stringify(syncPayload),
      }).catch((syncErr) => {
        console.error("GradeNext sync failed (non-fatal):", syncErr.message);
      });
    }

    return handleSuccess(res, course, "Course published successfully");
  } catch (err) {
    console.error("Publish course error:", err);
    return handleError(res, err, "Failed to publish course", 500);
  }
};

// ─── Module CRUD ─────────────────────────────────────────────────────────────

export const createModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, order } = req.body;

    const invalid = isValidMongoId([{ id: courseId, key: "Course ID" }]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const validation = validateWithZod(moduleSchema, {
      title,
      courseId,
      description,
      order: order !== undefined ? Number(order) : undefined,
    });
    if (!validation.success) {
      return handleError(res, { errors: validation.errors }, "Validation Error", 406);
    }

    const course = await Course.findOne({ _id: courseId, deletedAt: null });
    if (!course) return handleError(res, {}, "Course not found", 404);

    const module = await CourseModule.create({
      course: courseId,
      title,
      description,
      order: order !== undefined ? Number(order) : 0,
    });

    return handleSuccess(res, module, "Module created successfully", 201);
  } catch (err) {
    console.error("Create module error:", err);
    return handleError(res, err, "Failed to create module", 500);
  }
};

export const getCourseModules = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { filterDeleted = "true" } = req.query;

    const invalid = isValidMongoId([{ id: courseId, key: "Course ID" }]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const params = { course: courseId };
    if (filterDeleted === "true") params.deletedAt = null;

    const modules = await CourseModule.find(params, "-__v").sort({ order: 1 });
    return handleSuccess(res, { total: modules.length, modules }, "Modules fetched successfully");
  } catch (err) {
    console.error("Get course modules error:", err);
    return handleError(res, err, "Failed to fetch modules", 500);
  }
};

export const getModuleById = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;

    const invalid = isValidMongoId([
      { id: courseId, key: "Course ID" },
      { id: moduleId, key: "Module ID" },
    ]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const module = await CourseModule.findOne({ _id: moduleId, course: courseId, deletedAt: null }, "-__v");
    if (!module) return handleError(res, {}, "Module not found", 404);

    const lessons = await CourseLesson.find({ module: moduleId, deletedAt: null }, "-__v").sort({ order: 1 });
    return handleSuccess(res, { module, lessons }, "Module fetched successfully");
  } catch (err) {
    console.error("Get module by ID error:", err);
    return handleError(res, err, "Failed to fetch module", 500);
  }
};

export const updateModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, description, order } = req.body;

    const invalid = isValidMongoId([
      { id: courseId, key: "Course ID" },
      { id: moduleId, key: "Module ID" },
    ]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const validation = validateWithZod(updateModuleSchema, {
      title,
      description,
      order: order !== undefined ? Number(order) : undefined,
    });
    if (!validation.success) {
      return handleError(res, { errors: validation.errors }, "Validation Error", 406);
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (order !== undefined) updates.order = Number(order);

    const module = await CourseModule.findOneAndUpdate(
      { _id: moduleId, course: courseId, deletedAt: null },
      updates,
      { new: true, runValidators: true }
    );
    if (!module) return handleError(res, {}, "Module not found", 404);

    return handleSuccess(res, module, "Module updated successfully");
  } catch (err) {
    console.error("Update module error:", err);
    return handleError(res, err, "Failed to update module", 500);
  }
};

export const deleteModule = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { courseId, moduleId } = req.params;

    const invalid = isValidMongoId([
      { id: courseId, key: "Course ID" },
      { id: moduleId, key: "Module ID" },
    ]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    await session.withTransaction(async () => {
      const module = await CourseModule.findOne({ _id: moduleId, course: courseId, deletedAt: null }).session(session);
      if (!module) throw new Error("Module not found");

      const now = new Date();
      await CourseModule.findByIdAndUpdate(moduleId, { deletedAt: now }, { session });
      await CourseLesson.updateMany({ module: moduleId, deletedAt: null }, { deletedAt: now }, { session });
    });

    return handleSuccess(res, {}, "Module deleted successfully");
  } catch (err) {
    if (err.message === "Module not found") {
      return handleError(res, {}, "Module not found", 404);
    }
    console.error("Delete module error:", err);
    return handleError(res, err, "Failed to delete module", 500);
  } finally {
    await session.endSession();
  }
};

// ─── Lesson CRUD ─────────────────────────────────────────────────────────────

export const createLesson = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, description, order } = req.body;

    const invalid = isValidMongoId([
      { id: courseId, key: "Course ID" },
      { id: moduleId, key: "Module ID" },
    ]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const validation = validateWithZod(lessonSchema, {
      title,
      courseId,
      moduleId,
      description,
      order: order !== undefined ? Number(order) : undefined,
    });
    if (!validation.success) {
      return handleError(res, { errors: validation.errors }, "Validation Error", 406);
    }

    const module = await CourseModule.findOne({ _id: moduleId, course: courseId, deletedAt: null });
    if (!module) return handleError(res, {}, "Module not found", 404);

    const lesson = await CourseLesson.create({
      course: courseId,
      module: moduleId,
      title,
      description,
      order: order !== undefined ? Number(order) : 0,
    });

    return handleSuccess(res, lesson, "Lesson created successfully", 201);
  } catch (err) {
    console.error("Create lesson error:", err);
    return handleError(res, err, "Failed to create lesson", 500);
  }
};

export const getModuleLessons = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { filterDeleted = "true" } = req.query;

    const invalid = isValidMongoId([
      { id: courseId, key: "Course ID" },
      { id: moduleId, key: "Module ID" },
    ]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const params = { module: moduleId, course: courseId };
    if (filterDeleted === "true") params.deletedAt = null;

    const lessons = await CourseLesson.find(params, "-__v").sort({ order: 1 });
    return handleSuccess(res, { total: lessons.length, lessons }, "Lessons fetched successfully");
  } catch (err) {
    console.error("Get module lessons error:", err);
    return handleError(res, err, "Failed to fetch lessons", 500);
  }
};

export const updateLesson = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const { title, description, order } = req.body;

    const invalid = isValidMongoId([
      { id: courseId, key: "Course ID" },
      { id: moduleId, key: "Module ID" },
      { id: lessonId, key: "Lesson ID" },
    ]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const validation = validateWithZod(updateLessonSchema, {
      title,
      description,
      order: order !== undefined ? Number(order) : undefined,
    });
    if (!validation.success) {
      return handleError(res, { errors: validation.errors }, "Validation Error", 406);
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (order !== undefined) updates.order = Number(order);

    const lesson = await CourseLesson.findOneAndUpdate(
      { _id: lessonId, module: moduleId, course: courseId, deletedAt: null },
      updates,
      { new: true, runValidators: true }
    );
    if (!lesson) return handleError(res, {}, "Lesson not found", 404);

    return handleSuccess(res, lesson, "Lesson updated successfully");
  } catch (err) {
    console.error("Update lesson error:", err);
    return handleError(res, err, "Failed to update lesson", 500);
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;

    const invalid = isValidMongoId([
      { id: courseId, key: "Course ID" },
      { id: moduleId, key: "Module ID" },
      { id: lessonId, key: "Lesson ID" },
    ]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const lesson = await CourseLesson.findOneAndUpdate(
      { _id: lessonId, module: moduleId, course: courseId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!lesson) return handleError(res, {}, "Lesson not found", 404);

    return handleSuccess(res, {}, "Lesson deleted successfully");
  } catch (err) {
    console.error("Delete lesson error:", err);
    return handleError(res, err, "Failed to delete lesson", 500);
  }
};

export const uploadLessonFile = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const invalid = isValidMongoId([{ id: lessonId, key: "Lesson ID" }]);
    if (invalid.length > 0) {
      return handleError(res, {}, `Invalid ${invalid.join(", ")}`, 406);
    }

    const lesson = await CourseLesson.findOne({ _id: lessonId, deletedAt: null });
    if (!lesson) return handleError(res, {}, "Lesson not found", 404);

    if (!req.files?.file) {
      return handleError(res, {}, "No file provided", 400);
    }

    const file = req.files.file;
    const originalName = file.name;
    const ext = originalName.split(".").pop().toLowerCase();

    if (!["pdf", "ppt", "pptx"].includes(ext)) {
      return handleError(res, {}, "Only PDF, PPT, and PPTX files are allowed", 400);
    }

    const course = await Course.findById(lesson.course);
    const folderPath = `Cognitory/courses/${course?.slug || lesson.course.toString()}`;
    const publicId = `lesson_${lessonId}_${Date.now()}`;

    const result = await uploadCourseFile(file.tempFilePath, publicId, folderPath);

    const updatedLesson = await CourseLesson.findByIdAndUpdate(
      lessonId,
      {
        file: {
          url: result.secure_url,
          publicId: result.public_id,
          fileType: ext,
          originalName: originalName,
        },
      },
      { new: true }
    );

    return handleSuccess(res, updatedLesson, "File uploaded successfully");
  } catch (err) {
    console.error("Upload lesson file error:", err);
    return handleError(res, err, "Failed to upload file", 500);
  }
};

export const resyncAllCourses = async (req, res) => {
  try {
    const gradeNextUrl = process.env.GRADENEXT_API_URL;
    const syncSecret = process.env.GRADENEXT_SYNC_SECRET;
    if (!gradeNextUrl || !syncSecret) {
      return handleError(res, {}, "GRADENEXT_API_URL or GRADENEXT_SYNC_SECRET env vars not configured", 500);
    }

    const courses = await Course.find({ status: "published", deletedAt: null }).lean();
    if (!courses.length) return handleSuccess(res, { synced: 0 }, "No published courses to sync");

    const results = await Promise.allSettled(
      courses.map(async (course) => {
        const courseId = course._id.toString();
        const modules = await CourseModule.find({ course: courseId, deletedAt: null }).sort({ order: 1 }).lean();
        const moduleIds = modules.map((m) => m._id);
        const lessons = await CourseLesson.find({ module: { $in: moduleIds }, deletedAt: null }).sort({ order: 1 }).lean();

        const modulesWithLessons = modules.map((mod) => ({
          cognitory_id: mod._id.toString(),
          title: mod.title,
          description: mod.description,
          order: mod.order,
          lessons: lessons
            .filter((l) => l.module.toString() === mod._id.toString())
            .map((l) => ({
              cognitory_id: l._id.toString(),
              title: l.title,
              description: l.description,
              order: l.order,
              file: l.file,
            })),
        }));

        return fetch(`${gradeNextUrl}/api/courses/sync/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Sync-Secret": syncSecret },
          body: JSON.stringify({
            cognitory_id: courseId,
            title: course.title,
            slug: course.slug,
            description: course.description,
            course_type: course.type,
            thumbnail_url: course.thumbnail?.url || "",
            order: course.order,
            modules: modulesWithLessons,
          }),
        });
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    return handleSuccess(res, { synced: succeeded, total: courses.length }, `Re-synced ${succeeded}/${courses.length} courses`);
  } catch (err) {
    console.error("Resync all courses error:", err);
    return handleError(res, err, "Failed to re-sync courses", 500);
  }
};
