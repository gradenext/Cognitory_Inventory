import { z } from "zod";

export const questionSchema = z
  .object({
    text: z
      .string({ required_error: "Question text is required" })
      .min(1, "Question text cannot be empty"),

    textType: z.enum(["text", "markdown", "latex"], {
      errorMap: () => ({
        message: "Text type must be either 'text' or 'markdown'",
      }),
    }),
    image: z.array(z.url()).optional(),

    type: z.enum(["input", "multiple"], {
      errorMap: () => ({
        message: "Type must be either 'input' or 'multiple'",
      }),
    }),

    options: z.array(z.string()).optional(),

    answer: z
      .string({ required_error: "Answer is required" })
      .min(1, "Answer cannot be empty"),

    hint: z
      .string({ required_error: "Hint is required" })
      .min(1, "Hint cannot be empty"),

    explanation: z
      .string({ required_error: "Explanation is required" })
      .min(1, "Explanation cannot be empty"),

    creator: z
      .string({ required_error: "Creator ID is required" })
      .length(24, "Creator ID must be a valid 24-character ObjectId"),

    enterprise: z
      .string({ required_error: "Enterprise ID is required" })
      .length(24, "Enterprise ID must be a valid 24-character ObjectId"),

    class: z
      .string({ required_error: "Class ID is required" })
      .length(24, "Class ID must be a valid 24-character ObjectId"),

    subject: z
      .string({ required_error: "Subject ID is required" })
      .length(24, "Subject ID must be a valid 24-character ObjectId"),

    topic: z
      .string({ required_error: "Topic ID is required" })
      .length(24, "Topic ID must be a valid 24-character ObjectId"),

    subtopic: z
      .string({ required_error: "Subtopic ID is required" })
      .length(24, "Subtopic ID must be a valid 24-character ObjectId"),

    level: z
      .string({ required_error: "Level ID is required" })
      .length(24, "Level ID must be a valid 24-character ObjectId"),
  })
  .superRefine((data, ctx) => {
    if (data.type === "multiple") {
      if (!data.options || data.options.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["option"],
          message:
            "Exactly 4 options are required for multiple choice questions",
        });
      }
    }
  });
