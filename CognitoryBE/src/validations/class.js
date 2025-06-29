import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Name is required"),
  enterpriseId: z
    .string({ required_error: "Enterprise ID is required" })
    .length(24, "Enterprise ID must be a valid 24-character ObjectId"),
});
