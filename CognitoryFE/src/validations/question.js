import { z } from "zod";

export const addQuestionSchema = z
  .object({
    text: z.string().min(1, "Question text is required"),

    textType: z.enum(["text", "markdown", "latex"], {
      errorMap: () => ({
        message: "Text type is required",
      }),
    }),

    type: z.enum(["input", "multiple"], {
      errorMap: () => ({
        message: "Type is required",
      }),
    }),

    options: z.array(z.string()).optional(),

    answer: z.string().min(1, "Answer is required"),
    hint: z.string().min(1, "Hint is required"),
    explanation: z.string().min(1, "Explanation is required"),

    enterpriseId: z.string().length(24, "Enterprise is required"),
    classId: z.string().length(24, "Class is required"),
    subjectId: z.string().length(24, "Subject is required"),
    topicId: z.string().length(24, "Topic is required"),
    subtopicId: z.string().length(24, "Subtopic ID is required"),
    levelId: z.string().length(24, "Level ID is required"),

    images: z
      .array(z.instanceof(File), {
        invalid_type_error: "Each image must be a File object",
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "multiple") {
      if (!data.options || data.options.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message:
            "Exactly 4 options are required for multiple choice questions",
        });
      }
    }
  });

export const reviewSchema = z
  .object({
    approved: z.boolean(),
    editAllowed: z.boolean(),
    comment: z.string().optional(),
    rating: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().min(0).max(5).optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (
      data.approved === false &&
      (!data.comment || data.comment.trim() === "")
    ) {
      ctx.addIssue({
        path: ["comment"],
        code: z.ZodIssueCode.custom,
        message: "Comment is required when approved is false.",
      });
    }
  });
