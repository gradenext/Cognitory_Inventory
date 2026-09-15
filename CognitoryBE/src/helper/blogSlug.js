import slugify from "slugify";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const toSlug = (value = "") => slugify(String(value), { lower: true, strict: true, trim: true });
