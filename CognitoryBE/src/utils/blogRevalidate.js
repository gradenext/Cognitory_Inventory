// Tells gradenext.com to refresh its cached blog pages, sitemap and RSS feed.
export const triggerBlogRevalidate = () => {
  const siteUrl = process.env.GRADENEXT_WEBSITE_URL;
  const secret = process.env.BLOG_REVALIDATE_SECRET;
  if (!siteUrl || !secret) return;

  fetch(`${siteUrl.replace(/\/$/, "")}/api/revalidate/blog`, {
    method: "POST",
    headers: { "x-revalidate-secret": secret },
  })
    .then((res) => {
      if (!res.ok) console.error(`Blog revalidate failed (non-fatal): HTTP ${res.status}`);
    })
    .catch((err) => console.error("Blog revalidate failed (non-fatal):", err.message));
};
