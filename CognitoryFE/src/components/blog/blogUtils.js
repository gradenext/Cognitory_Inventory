export const WEBSITE_URL = "https://gradenext.com";

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const toSlug = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";

export const inputCls =
  "w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white placeholder-white/30";

export const selectCls =
  "w-full bg-black text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white";

export const labelCls = "text-white/70 text-sm mb-1 block";

export const hintCls = "text-white/30 text-xs mt-1";
