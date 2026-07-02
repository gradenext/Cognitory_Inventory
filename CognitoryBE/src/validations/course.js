import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["ai", "standard"], { required_error: "Type must be 'ai' or 'standard'" }),
  description: z.string().optional(),
  order: z.number().optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(["ai", "standard"]).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const moduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  courseId: z
    .string({ required_error: "Course ID is required" })
    .length(24, "Course ID must be a valid 24-character ObjectId"),
  description: z.string().optional(),
  order: z.number().optional(),
});

export const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  courseId: z
    .string({ required_error: "Course ID is required" })
    .length(24, "Course ID must be a valid 24-character ObjectId"),
  moduleId: z
    .string({ required_error: "Module ID is required" })
    .length(24, "Module ID must be a valid 24-character ObjectId"),
  description: z.string().optional(),
  order: z.number().optional(),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
});
