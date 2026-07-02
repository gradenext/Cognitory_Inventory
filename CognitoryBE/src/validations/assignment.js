import { z } from "zod";

export const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  courseId: z
    .string({ required_error: "Course ID is required" })
    .length(24, "Course ID must be a valid 24-character ObjectId"),
  description: z.string().optional(),
  order: z.number().optional(),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
});
