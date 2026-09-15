import express from "express";
import {
  listPostsAdmin,
  getPostAdmin,
  createPost,
  updatePost,
  publishPost,
  unpublishPost,
  deletePost,
  listAuthorsAdmin,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  listCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadBlogImage,
  listPublicPosts,
  getPublicPost,
  listPublicCategories,
  getPublicCategory,
  listPublicAuthors,
  getPublicAuthor,
  getPublicTag,
  getPublicSitemap,
} from "../controller/blogController.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public endpoints are read by gradenext.com; short CDN caching with stale fallbacks keeps pages rendering if this API is slow or down.
const publicCache = (req, res, next) => {
  res.set("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400");
  next();
};

router.get("/public/posts", publicCache, listPublicPosts);
router.get("/public/posts/:slug", publicCache, getPublicPost);
router.get("/public/categories", publicCache, listPublicCategories);
router.get("/public/categories/:slug", publicCache, getPublicCategory);
router.get("/public/authors", publicCache, listPublicAuthors);
router.get("/public/authors/:slug", publicCache, getPublicAuthor);
router.get("/public/tags/:slug", publicCache, getPublicTag);
router.get("/public/sitemap", publicCache, getPublicSitemap);

router.post("/admin/upload", authMiddleware, isAdmin, uploadBlogImage);

router.get("/admin/posts", authMiddleware, isAdmin, listPostsAdmin);
router.post("/admin/posts", authMiddleware, isAdmin, createPost);
router.get("/admin/posts/:postId", authMiddleware, isAdmin, getPostAdmin);
router.patch("/admin/posts/:postId", authMiddleware, isAdmin, updatePost);
router.patch("/admin/posts/:postId/publish", authMiddleware, isAdmin, publishPost);
router.patch("/admin/posts/:postId/unpublish", authMiddleware, isAdmin, unpublishPost);
router.delete("/admin/posts/:postId", authMiddleware, isAdmin, deletePost);

router.get("/admin/authors", authMiddleware, isAdmin, listAuthorsAdmin);
router.post("/admin/authors", authMiddleware, isAdmin, createAuthor);
router.patch("/admin/authors/:authorId", authMiddleware, isAdmin, updateAuthor);
router.delete("/admin/authors/:authorId", authMiddleware, isAdmin, deleteAuthor);

router.get("/admin/categories", authMiddleware, isAdmin, listCategoriesAdmin);
router.post("/admin/categories", authMiddleware, isAdmin, createCategory);
router.patch("/admin/categories/:categoryId", authMiddleware, isAdmin, updateCategory);
router.delete("/admin/categories/:categoryId", authMiddleware, isAdmin, deleteCategory);

export default router;
