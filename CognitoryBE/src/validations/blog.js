import { z } from "zod";
import { SLUG_PATTERN } from "../helper/blogSlug.js";

const slug = z
  .string({ required_error: "Slug is required" })
  .min(1, "Slug is required")
  .max(120, "Slug must be 120 characters or fewer")
  .regex(SLUG_PATTERN, "Slug must use lowercase letters, numbers and single hyphens");

const objectId = z
  .string()
  .length(24, "Must be a valid 24-character ObjectId")
  .nullable()
  .optional();

const image = z
  .object({
    url: z.string().optional(),
    publicId: z.string().optional(),
    alt: z.string().optional(),
  })
  .optional();

const optionalUrl = z.union([z.string().url("Must be a full URL (https://…)"), z.literal("")]).optional();

export const authorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug,
  role: z.string().optional(),
  bio: z.string().optional(),
  credentials: z.string().optional(),
  photo: image,
  socialLinks: z
    .object({ linkedin: optionalUrl, x: optionalUrl, website: optionalUrl })
    .optional(),
  order: z.number().optional(),
});

export const updateAuthorSchema = authorSchema.partial();

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug,
  description: z.string().optional(),
  featuredImage: image,
  order: z.number().optional(),
});

export const updateCategorySchema = categorySchema.partial();

export const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug,
  metaTitle: z.string().max(60, "Meta title must be 60 characters or fewer").optional(),
  metaDescription: z.string().max(170, "Meta description should be 140–160 characters").optional(),
  excerpt: z.string().optional(),
  answerFirstSummary: z.string().optional(),
  body: z.string().optional(),
  featuredImage: image,
  author: objectId,
  category: objectId,
  tags: z.array(z.string()).optional(),
  funnelStage: z.enum(["top", "middle", "bottom"]).optional(),
  faq: z
    .array(
      z.object({
        question: z.string().min(1, "FAQ question is required"),
        answer: z.string().min(1, "FAQ answer is required"),
      })
    )
    .optional(),
  relatedPosts: z.array(z.string().length(24, "Related post id is invalid")).optional(),
});

export const updatePostSchema = postSchema.partial();
