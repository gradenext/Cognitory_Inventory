import fs from "fs/promises";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import BlogPost from "../models/BlogPost.js";
import BlogAuthor from "../models/BlogAuthor.js";
import BlogCategory from "../models/BlogCategory.js";
import { validateWithZod } from "../validations/validate.js";
import {
  postSchema,
  updatePostSchema,
  authorSchema,
  updateAuthorSchema,
  categorySchema,
  updateCategorySchema,
} from "../validations/blog.js";
import handleError from "../helper/handleError.js";
import handleSuccess from "../helper/handleSuccess.js";
import { getPaginationMeta } from "../helper/getPaginationMeta.js";
import { toSlug } from "../helper/blogSlug.js";
import { upload } from "../utils/upload.js";
import { triggerBlogRevalidate } from "../utils/blogRevalidate.js";

const PUBLISHED = { status: "published", deletedAt: null };
const CARD_FIELDS = "title slug excerpt featuredImage category author datePublished dateModified";
const AUTHOR_CARD = "name slug role photo";
const AUTHOR_FULL = "name slug role bio credentials photo socialLinks";
const CATEGORY_CARD = "name slug";

const POST_FIELDS = [
  "title", "slug", "metaTitle", "metaDescription", "excerpt", "answerFirstSummary", "body",
  "featuredImage", "author", "category", "tags", "funnelStage", "faq", "relatedPosts",
];
const AUTHOR_FIELDS = ["name", "slug", "role", "bio", "credentials", "photo", "socialLinks", "order"];
const CATEGORY_FIELDS = ["name", "slug", "description", "featuredImage", "order"];

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

const pick = (source = {}, fields) =>
  fields.reduce((out, key) => {
    if (source[key] !== undefined) out[key] = source[key];
    return out;
  }, {});

const normalizePostRefs = (data, postId) => {
  const out = { ...data };
  if (out.author === "") out.author = null;
  if (out.category === "") out.category = null;
  if (Array.isArray(out.relatedPosts)) {
    out.relatedPosts = [...new Set(out.relatedPosts)].filter((id) => isId(id) && String(id) !== String(postId));
  }
  return out;
};

const missingForPublish = (post) => {
  const missing = [];
  if (!post.title) missing.push("title");
  if (!post.slug) missing.push("slug");
  if (!post.metaDescription) missing.push("meta description");
  if (!post.excerpt) missing.push("excerpt");
  if (!post.answerFirstSummary) missing.push("answer-first summary");
  if (!post.body) missing.push("body");
  if (!post.featuredImage?.url) missing.push("featured image");
  if (!post.featuredImage?.alt) missing.push("featured image alt text");
  if (!post.author) missing.push("author");
  if (!post.category) missing.push("category");
  return missing;
};

const postSlugTaken = (slug, excludeId) => {
  const filter = { $or: [{ slug }, { previousSlugs: slug }] };
  if (excludeId) filter._id = { $ne: excludeId };
  return BlogPost.exists(filter);
};

const slugTaken = (Model, slug, excludeId) => {
  const filter = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  return Model.exists(filter);
};

const countPublishedBy = async (field) => {
  const rows = await BlogPost.aggregate([
    { $match: PUBLISHED },
    { $group: { _id: `$${field}`, count: { $sum: 1 }, lastModified: { $max: "$dateModified" } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
};

// ─── Admin: posts ────────────────────────────────────────────────────────────

export const listPostsAdmin = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const filter = { deletedAt: null };
    if (["draft", "published"].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.q) {
      const escaped = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escaped, $options: "i" };
    }

    const [totalItems, posts] = await Promise.all([
      BlogPost.countDocuments(filter),
      BlogPost.find(filter, "-body -previousSlugs")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "name slug")
        .populate("category", "name slug")
        .lean(),
    ]);

    return handleSuccess(res, { posts, pagination: getPaginationMeta({ page, limit, totalItems }) }, "Posts fetched");
  } catch (error) {
    return handleError(res, error, "Failed to fetch posts", 500);
  }
};

export const getPostAdmin = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isId(postId)) return handleError(res, {}, "Invalid post id", 400);
    const post = await BlogPost.findOne({ _id: postId, deletedAt: null }).lean();
    if (!post) return handleError(res, {}, "Post not found", 404);
    return handleSuccess(res, post, "Post fetched");
  } catch (error) {
    return handleError(res, error, "Failed to fetch post", 500);
  }
};

export const createPost = async (req, res) => {
  try {
    const data = pick(req.body, POST_FIELDS);
    const validation = validateWithZod(postSchema, data);
    if (!validation.success) return handleError(res, validation.errors, "Validation failed", 400);
    if (await postSlugTaken(data.slug)) return handleError(res, {}, "This slug is already used by another post", 409);

    const post = await BlogPost.create({
      ...normalizePostRefs(data),
      status: "draft",
      createdBy: req.user?.userId || null,
    });
    return handleSuccess(res, post, "Post created", 201);
  } catch (error) {
    return handleError(res, error, "Failed to create post", 500);
  }
};

export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isId(postId)) return handleError(res, {}, "Invalid post id", 400);
    const data = pick(req.body, POST_FIELDS);
    const validation = validateWithZod(updatePostSchema, data);
    if (!validation.success) return handleError(res, validation.errors, "Validation failed", 400);

    const post = await BlogPost.findOne({ _id: postId, deletedAt: null });
    if (!post) return handleError(res, {}, "Post not found", 404);

    if (data.slug && data.slug !== post.slug) {
      if (await postSlugTaken(data.slug, postId)) {
        return handleError(res, {}, "This slug is already used by another post", 409);
      }
      if (post.status === "published" && !post.previousSlugs.includes(post.slug)) {
        post.previousSlugs.push(post.slug);
      }
      post.previousSlugs = post.previousSlugs.filter((s) => s !== data.slug);
    }

    Object.assign(post, normalizePostRefs(data, postId));

    if (post.status === "published") {
      const missing = missingForPublish(post);
      if (missing.length) {
        return handleError(res, { missing }, `A published post needs: ${missing.join(", ")}`, 400);
      }
      post.dateModified = new Date();
    }

    await post.save();
    if (post.status === "published") triggerBlogRevalidate();
    return handleSuccess(res, post, "Post updated");
  } catch (error) {
    return handleError(res, error, "Failed to update post", 500);
  }
};

export const publishPost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isId(postId)) return handleError(res, {}, "Invalid post id", 400);
    const post = await BlogPost.findOne({ _id: postId, deletedAt: null });
    if (!post) return handleError(res, {}, "Post not found", 404);

    const missing = missingForPublish(post);
    if (missing.length) {
      return handleError(res, { missing }, `Add these before publishing: ${missing.join(", ")}`, 400);
    }

    const now = new Date();
    post.status = "published";
    if (!post.datePublished) post.datePublished = now;
    post.dateModified = now;
    await post.save();

    triggerBlogRevalidate();
    return handleSuccess(res, post, "Post published");
  } catch (error) {
    return handleError(res, error, "Failed to publish post", 500);
  }
};

export const unpublishPost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isId(postId)) return handleError(res, {}, "Invalid post id", 400);
    const post = await BlogPost.findOneAndUpdate(
      { _id: postId, deletedAt: null },
      { status: "draft" },
      { new: true }
    );
    if (!post) return handleError(res, {}, "Post not found", 404);

    triggerBlogRevalidate();
    return handleSuccess(res, post, "Post moved to drafts");
  } catch (error) {
    return handleError(res, error, "Failed to unpublish post", 500);
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isId(postId)) return handleError(res, {}, "Invalid post id", 400);
    const post = await BlogPost.findOne({ _id: postId, deletedAt: null });
    if (!post) return handleError(res, {}, "Post not found", 404);

    const wasPublished = post.status === "published";
    post.deletedAt = new Date();
    post.status = "draft";
    await post.save();
    await BlogPost.updateMany({ relatedPosts: post._id }, { $pull: { relatedPosts: post._id } });

    if (wasPublished) triggerBlogRevalidate();
    return handleSuccess(res, {}, "Post deleted");
  } catch (error) {
    return handleError(res, error, "Failed to delete post", 500);
  }
};

// ─── Admin: authors & categories ─────────────────────────────────────────────

const listTaxonomyAdmin = (Model, field, label) => async (req, res) => {
  try {
    const [items, rows] = await Promise.all([
      Model.find({ deletedAt: null }).sort({ order: 1, name: 1 }).lean(),
      BlogPost.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      ]),
    ]);
    const counts = new Map(rows.map((r) => [String(r._id), r.count]));
    return handleSuccess(
      res,
      items.map((item) => ({ ...item, postCount: counts.get(String(item._id)) || 0 })),
      `${label} fetched`
    );
  } catch (error) {
    return handleError(res, error, `Failed to fetch ${label.toLowerCase()}`, 500);
  }
};

const createTaxonomy = (Model, schema, fields, label) => async (req, res) => {
  try {
    const data = pick(req.body, fields);
    const validation = validateWithZod(schema, data);
    if (!validation.success) return handleError(res, validation.errors, "Validation failed", 400);
    if (await slugTaken(Model, data.slug)) return handleError(res, {}, "This slug is already in use", 409);

    const item = await Model.create(data);
    triggerBlogRevalidate();
    return handleSuccess(res, item, `${label} created`, 201);
  } catch (error) {
    return handleError(res, error, `Failed to create ${label.toLowerCase()}`, 500);
  }
};

const updateTaxonomy = (Model, schema, fields, label, param) => async (req, res) => {
  try {
    const id = req.params[param];
    if (!isId(id)) return handleError(res, {}, `Invalid ${label.toLowerCase()} id`, 400);
    const data = pick(req.body, fields);
    const validation = validateWithZod(schema, data);
    if (!validation.success) return handleError(res, validation.errors, "Validation failed", 400);
    if (data.slug && (await slugTaken(Model, data.slug, id))) {
      return handleError(res, {}, "This slug is already in use", 409);
    }

    const item = await Model.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true });
    if (!item) return handleError(res, {}, `${label} not found`, 404);

    triggerBlogRevalidate();
    return handleSuccess(res, item, `${label} updated`);
  } catch (error) {
    return handleError(res, error, `Failed to update ${label.toLowerCase()}`, 500);
  }
};

const deleteTaxonomy = (Model, field, label, param) => async (req, res) => {
  try {
    const id = req.params[param];
    if (!isId(id)) return handleError(res, {}, `Invalid ${label.toLowerCase()} id`, 400);
    if (await BlogPost.exists({ [field]: id, deletedAt: null })) {
      return handleError(res, {}, `This ${label.toLowerCase()} still has posts. Reassign or delete them first.`, 409);
    }

    const item = await Model.findOneAndUpdate({ _id: id, deletedAt: null }, { deletedAt: new Date() });
    if (!item) return handleError(res, {}, `${label} not found`, 404);

    triggerBlogRevalidate();
    return handleSuccess(res, {}, `${label} deleted`);
  } catch (error) {
    return handleError(res, error, `Failed to delete ${label.toLowerCase()}`, 500);
  }
};

export const listAuthorsAdmin = listTaxonomyAdmin(BlogAuthor, "author", "Authors");
export const createAuthor = createTaxonomy(BlogAuthor, authorSchema, AUTHOR_FIELDS, "Author");
export const updateAuthor = updateTaxonomy(BlogAuthor, updateAuthorSchema, AUTHOR_FIELDS, "Author", "authorId");
export const deleteAuthor = deleteTaxonomy(BlogAuthor, "author", "Author", "authorId");

export const listCategoriesAdmin = listTaxonomyAdmin(BlogCategory, "category", "Categories");
export const createCategory = createTaxonomy(BlogCategory, categorySchema, CATEGORY_FIELDS, "Category");
export const updateCategory = updateTaxonomy(BlogCategory, updateCategorySchema, CATEGORY_FIELDS, "Category", "categoryId");
export const deleteCategory = deleteTaxonomy(BlogCategory, "category", "Category", "categoryId");

export const uploadBlogImage = async (req, res) => {
  const file = req.files?.image;
  if (!file || Array.isArray(file)) return handleError(res, {}, "Upload one image in the 'image' field", 400);

  try {
    if (!String(file.mimetype).startsWith("image/")) {
      return handleError(res, {}, "Only image files can be uploaded", 400);
    }
    const result = await upload(file.tempFilePath, `blog-${uuidv4()}`);
    return handleSuccess(res, { url: result.secure_url, publicId: result.public_id }, "Image uploaded");
  } catch (error) {
    return handleError(res, error, "Image upload failed", 500);
  } finally {
    await fs.unlink(file.tempFilePath).catch(() => {});
  }
};

// ─── Public (read-only, published content only) ──────────────────────────────

const findRelatedPosts = async (post) => {
  const chosenIds = post.relatedPosts || [];
  const chosen = chosenIds.length
    ? await BlogPost.find({ _id: { $in: chosenIds }, ...PUBLISHED }, CARD_FIELDS)
        .populate("author", AUTHOR_CARD)
        .populate("category", CATEGORY_CARD)
        .lean()
    : [];
  const ordered = chosenIds
    .map((id) => chosen.find((p) => p._id.equals(id)))
    .filter(Boolean)
    .slice(0, 3);
  if (ordered.length >= 3 || !post.category) return ordered;

  const fill = await BlogPost.find(
    { ...PUBLISHED, category: post.category._id, _id: { $nin: [post._id, ...ordered.map((p) => p._id)] } },
    CARD_FIELDS
  )
    .sort({ datePublished: -1 })
    .limit(3 - ordered.length)
    .populate("author", AUTHOR_CARD)
    .populate("category", CATEGORY_CARD)
    .lean();
  return [...ordered, ...fill];
};

export const listPublicPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9));
    const filter = { ...PUBLISHED };

    if (req.query.category) {
      const category = await BlogCategory.findOne({ slug: req.query.category, deletedAt: null }, "_id").lean();
      if (!category) return handleError(res, {}, "Category not found", 404);
      filter.category = category._id;
    }
    if (req.query.author) {
      const author = await BlogAuthor.findOne({ slug: req.query.author, deletedAt: null }, "_id").lean();
      if (!author) return handleError(res, {}, "Author not found", 404);
      filter.author = author._id;
    }
    if (req.query.tag) filter.tagSlugs = String(req.query.tag);

    const [totalItems, posts] = await Promise.all([
      BlogPost.countDocuments(filter),
      BlogPost.find(filter, CARD_FIELDS)
        .sort({ datePublished: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", AUTHOR_CARD)
        .populate("category", CATEGORY_CARD)
        .lean(),
    ]);

    return handleSuccess(res, { posts, pagination: getPaginationMeta({ page, limit, totalItems }) }, "Posts fetched");
  } catch (error) {
    return handleError(res, error, "Failed to fetch posts", 500);
  }
};

export const getPublicPost = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await BlogPost.findOne({ slug, ...PUBLISHED }, "-previousSlugs -createdBy -funnelStage -tagSlugs -__v")
      .populate("author", AUTHOR_FULL)
      .populate("category", "name slug description")
      .lean();

    if (!post) {
      const moved = await BlogPost.findOne({ previousSlugs: slug, ...PUBLISHED }, "slug").lean();
      if (moved) return handleSuccess(res, { redirectTo: moved.slug }, "Post moved");
      return handleError(res, {}, "Post not found", 404);
    }

    const relatedPosts = await findRelatedPosts(post);
    const tags = (post.tags || []).map((name) => ({ name, slug: toSlug(name) }));
    return handleSuccess(res, { post: { ...post, tags, relatedPosts } }, "Post fetched");
  } catch (error) {
    return handleError(res, error, "Failed to fetch post", 500);
  }
};

export const listPublicCategories = async (req, res) => {
  try {
    const [categories, counts] = await Promise.all([
      BlogCategory.find({ deletedAt: null }, "name slug description featuredImage order updatedAt").sort({ order: 1, name: 1 }).lean(),
      countPublishedBy("category"),
    ]);
    return handleSuccess(
      res,
      categories.map((c) => ({ ...c, postCount: counts.get(String(c._id))?.count || 0 })),
      "Categories fetched"
    );
  } catch (error) {
    return handleError(res, error, "Failed to fetch categories", 500);
  }
};

export const getPublicCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findOne(
      { slug: req.params.slug, deletedAt: null },
      "name slug description featuredImage updatedAt"
    ).lean();
    if (!category) return handleError(res, {}, "Category not found", 404);
    return handleSuccess(res, category, "Category fetched");
  } catch (error) {
    return handleError(res, error, "Failed to fetch category", 500);
  }
};

export const listPublicAuthors = async (req, res) => {
  try {
    const [authors, counts] = await Promise.all([
      BlogAuthor.find({ deletedAt: null }, `${AUTHOR_FULL} order updatedAt`).sort({ order: 1, name: 1 }).lean(),
      countPublishedBy("author"),
    ]);
    return handleSuccess(
      res,
      authors.map((a) => ({ ...a, postCount: counts.get(String(a._id))?.count || 0 })),
      "Authors fetched"
    );
  } catch (error) {
    return handleError(res, error, "Failed to fetch authors", 500);
  }
};

export const getPublicAuthor = async (req, res) => {
  try {
    const author = await BlogAuthor.findOne({ slug: req.params.slug, deletedAt: null }, `${AUTHOR_FULL} updatedAt`).lean();
    if (!author) return handleError(res, {}, "Author not found", 404);
    return handleSuccess(res, author, "Author fetched");
  } catch (error) {
    return handleError(res, error, "Failed to fetch author", 500);
  }
};

export const getPublicTag = async (req, res) => {
  try {
    const { slug } = req.params;
    const [sample, postCount] = await Promise.all([
      BlogPost.findOne({ ...PUBLISHED, tagSlugs: slug }, "tags").lean(),
      BlogPost.countDocuments({ ...PUBLISHED, tagSlugs: slug }),
    ]);
    if (!sample) return handleError(res, {}, "Tag not found", 404);
    const name = sample.tags.find((t) => toSlug(t) === slug) || slug;
    return handleSuccess(res, { slug, name, postCount }, "Tag fetched");
  } catch (error) {
    return handleError(res, error, "Failed to fetch tag", 500);
  }
};

export const getPublicSitemap = async (req, res) => {
  try {
    const [posts, categories, authors, byCategory, byAuthor] = await Promise.all([
      BlogPost.find(PUBLISHED, "slug datePublished dateModified").sort({ datePublished: -1 }).lean(),
      BlogCategory.find({ deletedAt: null }, "slug updatedAt").lean(),
      BlogAuthor.find({ deletedAt: null }, "slug updatedAt").lean(),
      countPublishedBy("category"),
      countPublishedBy("author"),
    ]);

    const latest = (doc, map) => {
      const postDate = map.get(String(doc._id))?.lastModified;
      return postDate && postDate > doc.updatedAt ? postDate : doc.updatedAt;
    };

    return handleSuccess(
      res,
      {
        posts: posts.map((p) => ({ slug: p.slug, lastModified: p.dateModified || p.datePublished })),
        categories: categories.map((c) => ({ slug: c.slug, lastModified: latest(c, byCategory) })),
        authors: authors.map((a) => ({ slug: a.slug, lastModified: latest(a, byAuthor) })),
      },
      "Sitemap entries fetched"
    );
  } catch (error) {
    return handleError(res, error, "Failed to fetch sitemap entries", 500);
  }
};
