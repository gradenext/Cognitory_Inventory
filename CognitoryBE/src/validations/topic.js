import { z } from "zod";

export const topicSchema = z.object({
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
});
