import { api } from "./api";
import { errorToast } from "../components/toast/Toast";

const messageFrom = (error) => {
  const data = error?.response?.data;
  const fieldErrors = data?.error?.error;
  if (fieldErrors && typeof fieldErrors === "object") {
    const first = Object.values(fieldErrors)[0];
    if (first) return `${data.message}: ${first}`;
  }
  return data?.message || "Something went wrong";
};

const run = async (request, fallback) => {
  try {
    const response = await request();
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(messageFrom(error));
    if (fallback !== undefined) return fallback;
    throw error;
  }
};

export const getBlogPosts = (params = {}) =>
  run(() => api.get("/blog/admin/posts", { params }), { posts: [], pagination: null });
export const getBlogPost = (postId) => run(() => api.get(`/blog/admin/posts/${postId}`), null);
export const createBlogPost = (data) => run(() => api.post("/blog/admin/posts", data));
export const updateBlogPost = (postId, data) => run(() => api.patch(`/blog/admin/posts/${postId}`, data));
export const publishBlogPost = (postId) => run(() => api.patch(`/blog/admin/posts/${postId}/publish`));
export const unpublishBlogPost = (postId) => run(() => api.patch(`/blog/admin/posts/${postId}/unpublish`));
export const deleteBlogPost = (postId) => run(() => api.delete(`/blog/admin/posts/${postId}`));

export const getBlogAuthors = () => run(() => api.get("/blog/admin/authors"), []);
export const createBlogAuthor = (data) => run(() => api.post("/blog/admin/authors", data));
export const updateBlogAuthor = (authorId, data) => run(() => api.patch(`/blog/admin/authors/${authorId}`, data));
export const deleteBlogAuthor = (authorId) => run(() => api.delete(`/blog/admin/authors/${authorId}`));

export const getBlogCategories = () => run(() => api.get("/blog/admin/categories"), []);
export const createBlogCategory = (data) => run(() => api.post("/blog/admin/categories", data));
export const updateBlogCategory = (categoryId, data) =>
  run(() => api.patch(`/blog/admin/categories/${categoryId}`, data));
export const deleteBlogCategory = (categoryId) => run(() => api.delete(`/blog/admin/categories/${categoryId}`));

export const uploadBlogImage = (file) => {
  const form = new FormData();
  form.append("image", file);
  return run(() => api.post("/blog/admin/upload", form));
};
