import { z } from "zod";

export const levelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  enterpriseId: z
    .string({ required_error: "Enterprise ID is required" })
    .length(24, "Enterprise ID must be a valid 24-character ObjectId"),

  classId: z
    .string({ required_error: "Class ID is required" })
    .length(24, "Class ID must be a valid 24-character ObjectId"),

  subjectId: z
    .string({ required_error: "Subject ID is required" })
    .length(24, "Subject ID must be a valid 24-character ObjectId"),

  topicId: z
    .string({ required_error: "Topic ID is required" })
    .length(24, "Topic ID must be a valid 24-character ObjectId"),

  subtopicId: z
    .string({ required_error: "Subtopic ID is required" })
    .length(24, "Subtopic ID must be a valid 24-character ObjectId"),
});
