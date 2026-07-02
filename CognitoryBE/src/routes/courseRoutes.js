import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
  createModule,
  getCourseModules,
  getModuleById,
  updateModule,
  deleteModule,
  createLesson,
  getModuleLessons,
  updateLesson,
  deleteLesson,
  uploadLessonFile,
  resyncAllCourses,
} from "../controller/courseController.js";
import {
  createAssignment,
  getCourseAssignments,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
  uploadAssignmentFile,
  resyncCourseAssignments,
} from "../controller/assignmentController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Course routes
router.post("/", authMiddleware, isAdmin, createCourse);
router.get("/", authMiddleware, getAllCourses);
router.get("/:courseId", authMiddleware, getCourseById);
router.patch("/:courseId/publish", authMiddleware, isAdmin, publishCourse);
router.patch("/:courseId", authMiddleware, isAdmin, updateCourse);
router.delete("/:courseId", authMiddleware, isAdmin, deleteCourse);

// Module routes
router.post("/:courseId/module", authMiddleware, isAdmin, createModule);
router.get("/:courseId/module", authMiddleware, getCourseModules);
router.get("/:courseId/module/:moduleId", authMiddleware, getModuleById);
router.patch("/:courseId/module/:moduleId", authMiddleware, isAdmin, updateModule);
router.delete("/:courseId/module/:moduleId", authMiddleware, isAdmin, deleteModule);

// Lesson routes
router.post("/:courseId/module/:moduleId/lesson", authMiddleware, isAdmin, createLesson);
router.get("/:courseId/module/:moduleId/lesson", authMiddleware, getModuleLessons);
router.patch("/:courseId/module/:moduleId/lesson/:lessonId", authMiddleware, isAdmin, updateLesson);
router.delete("/:courseId/module/:moduleId/lesson/:lessonId", authMiddleware, isAdmin, deleteLesson);

// File upload (lesson-level)
router.post("/lesson/:lessonId/upload", authMiddleware, isAdmin, uploadLessonFile);

// Assignment routes (per course)
router.post("/:courseId/assignment", authMiddleware, isAdmin, createAssignment);
router.get("/:courseId/assignment", authMiddleware, getCourseAssignments);
router.patch("/:courseId/assignment/:assignmentId/publish", authMiddleware, isAdmin, publishAssignment);
router.patch("/:courseId/assignment/:assignmentId", authMiddleware, isAdmin, updateAssignment);
router.delete("/:courseId/assignment/:assignmentId", authMiddleware, isAdmin, deleteAssignment);

// File upload (assignment-level)
router.post("/assignment/:assignmentId/upload", authMiddleware, isAdmin, uploadAssignmentFile);

// Re-sync all published assignments for a course to GradeNext
router.post("/:courseId/assignment/resync", authMiddleware, isAdmin, resyncCourseAssignments);

// Re-sync ALL published courses (+ modules + lessons) to GradeNext
router.post("/resync/all", authMiddleware, isAdmin, resyncAllCourses);

export default router;
