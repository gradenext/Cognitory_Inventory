import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Plus, Trash2, Globe, EyeOff, Save, ExternalLink, CheckCircle2, Circle } from "lucide-react";
import {
  getBlogPost,
  getBlogPosts,
  getBlogAuthors,
  getBlogCategories,
  createBlogPost,
  updateBlogPost,
  publishBlogPost,
  unpublishBlogPost,
} from "../../services/blogAPIs";
import { successToast, errorToast } from "../toast/Toast";
import MarkdownPreview from "./MarkdownPreview";
import BlogImageField from "./BlogImageField";
import { WEBSITE_URL, SLUG_RE, toSlug, inputCls, selectCls, labelCls, hintCls } from "./blogUtils";

const EMPTY = {
  title: "",
  slug: "",
  metaTitle: "",
  metaDescription: "",
  excerpt: "",
  answerFirstSummary: "",
  body: "",
  featuredImage: { url: "", publicId: "", alt: "" },
  author: "",
  category: "",
  tags: "",
  funnelStage: "top",
  faq: [],
  relatedPosts: [],
};

const PRODUCT_PATHS = [
  "/online-math-tutoring",
  "/online-coding-classes-for-kids",
  "/kumon-alternative",
  "/mathnasium-alternative",
  "/online-tutoring-vs-learning-center",
  "/regular",
  "/coding",
  "/pricing",
  "/mentors",
  "/how-it-works",
  "/book-a-demo",
];

const toForm = (post) => ({
  ...EMPTY,
  title: post.title || "",
  slug: post.slug || "",
  metaTitle: post.metaTitle || "",
  metaDescription: post.metaDescription || "",
  excerpt: post.excerpt || "",
  answerFirstSummary: post.answerFirstSummary || "",
  body: post.body || "",
  featuredImage: { ...EMPTY.featuredImage, ...(post.featuredImage || {}) },
  author: post.author ? String(post.author) : "",
  category: post.category ? String(post.category) : "",
  tags: (post.tags || []).join(", "),
  funnelStage: post.funnelStage || "top",
  faq: post.faq || [],
  relatedPosts: (post.relatedPosts || []).map(String),
});

const toPayload = (form) => ({
  title: form.title.trim(),
  slug: form.slug.trim(),
  metaTitle: form.metaTitle.trim(),
  metaDescription: form.metaDescription.trim(),
  excerpt: form.excerpt.trim(),
  answerFirstSummary: form.answerFirstSummary.trim(),
  body: form.body,
  featuredImage: {
    url: form.featuredImage.url.trim(),
    publicId: form.featuredImage.publicId || "",
    alt: form.featuredImage.alt.trim(),
  },
  author: form.author || null,
  category: form.category || null,
  tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
  funnelStage: form.funnelStage,
  faq: form.faq
    .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
    .filter((f) => f.question && f.answer),
  relatedPosts: form.relatedPosts,
});

const Counter = ({ value, min, max }) => {
  const length = value.length;
  const ok = (min === undefined || length >= min) && length <= max;
  return (
    <span className={`text-xs ${ok ? "text-green-400" : "text-yellow-400"}`}>
      {length}
      {min !== undefined ? ` / ${min}–${max}` : ` / ${max}`}
    </span>
  );
};

const BlogPostEditor = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const role = useSelector((state) => state?.user?.user?.role);
  const basePath = role === "super" ? "/super" : "/admin";

  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("draft");
  const [savedSlug, setSavedSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("split");
  const [relatedSearch, setRelatedSearch] = useState("");

  useEffect(() => {
    getBlogAuthors().then(setAuthors);
    getBlogCategories().then(setCategories);
    getBlogPosts({ limit: 100 }).then((data) => setAllPosts(data?.posts || []));
  }, []);

  useEffect(() => {
    if (!postId) {
      setForm(EMPTY);
      setStatus("draft");
      setSavedSlug("");
      setSlugEdited(false);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getBlogPost(postId).then((post) => {
      if (!active) return;
      if (post) {
        setForm(toForm(post));
        setStatus(post.status);
        setSavedSlug(post.slug);
        setSlugEdited(true);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [postId]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setTitle = (e) => {
    const title = e.target.value;
    setForm((f) => ({ ...f, title, slug: slugEdited ? f.slug : toSlug(title) }));
  };

  const setSlug = (e) => {
    setSlugEdited(true);
    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }));
  };

  const wordCount = useMemo(() => (form.body.trim() ? form.body.trim().split(/\s+/).length : 0), [form.body]);

  const checks = [
    { label: "Title", ok: Boolean(form.title.trim()), required: true },
    { label: "Valid slug", ok: SLUG_RE.test(form.slug), required: true },
    { label: "Answer-first summary", ok: Boolean(form.answerFirstSummary.trim()), required: true },
    { label: "Body", ok: Boolean(form.body.trim()), required: true },
    { label: "Featured image + alt text", ok: Boolean(form.featuredImage.url && form.featuredImage.alt), required: true },
    { label: "Author", ok: Boolean(form.author), required: true },
    { label: "Category", ok: Boolean(form.category), required: true },
    { label: "Meta description", ok: Boolean(form.metaDescription.trim()), required: true },
    { label: "Excerpt", ok: Boolean(form.excerpt.trim()), required: true },
    { label: "Meta title ≤ 60 characters", ok: form.metaTitle.length <= 60 },
    { label: "Meta description 140–160 characters", ok: form.metaDescription.length >= 140 && form.metaDescription.length <= 160 },
    { label: `Body 800–1,500 words (${wordCount})`, ok: wordCount >= 800 && wordCount <= 1500 },
    { label: "Links to a product/SEO page", ok: PRODUCT_PATHS.some((p) => form.body.includes(`](${p}`)) },
    { label: "Links to another blog post", ok: form.body.includes("](/blog/") },
  ];

  const save = async () => {
    if (!form.title.trim()) {
      errorToast("Title is required");
      return null;
    }
    if (!SLUG_RE.test(form.slug)) {
      errorToast("Slug must use lowercase letters, numbers and single hyphens");
      return null;
    }
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (postId) {
        const post = await updateBlogPost(postId, payload);
        setSavedSlug(post.slug);
        successToast(status === "published" ? "Changes published" : "Draft saved");
        return post;
      }
      const post = await createBlogPost(payload);
      successToast("Draft created");
      navigate(`${basePath}/blog/posts/${post._id}`, { replace: true });
      return post;
    } catch {
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!postId) return errorToast("Save the draft before publishing");
    const saved = await save();
    if (!saved) return;
    if (!confirm("Publish this post on gradenext.com?")) return;
    setSaving(true);
    try {
      await publishBlogPost(postId);
      setStatus("published");
      successToast("Post published");
    } catch {
      // error toast shown by service
    } finally {
      setSaving(false);
    }
  };

  const unpublish = async () => {
    if (!confirm("Move this post back to drafts? It will disappear from gradenext.com.")) return;
    setSaving(true);
    try {
      await unpublishBlogPost(postId);
      setStatus("draft");
      successToast("Post moved to drafts");
    } catch {
      // error toast shown by service
    } finally {
      setSaving(false);
    }
  };

  const updateFaq = (index, field, value) =>
    setForm((f) => ({ ...f, faq: f.faq.map((item, i) => (i === index ? { ...item, [field]: value } : item)) }));

  const toggleRelated = (id) =>
    setForm((f) => {
      if (f.relatedPosts.includes(id)) return { ...f, relatedPosts: f.relatedPosts.filter((r) => r !== id) };
      if (f.relatedPosts.length >= 3) {
        errorToast("Pick up to 3 related posts");
        return f;
      }
      return { ...f, relatedPosts: [...f.relatedPosts, id] };
    });

  const relatedOptions = allPosts
    .filter((p) => p._id !== postId)
    .filter((p) => p.title.toLowerCase().includes(relatedSearch.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const slugChangedAfterPublish = status === "published" && savedSlug && form.slug !== savedSlug;

  return (
    <div className="p-4 md:p-6 text-white w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${basePath}/blog`)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Back to posts"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold">{postId ? "Edit post" : "New post"}</h1>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              status === "published" ? "bg-green-500/30 text-green-300" : "bg-yellow-500/30 text-yellow-300"
            }`}
          >
            {status === "published" ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {status === "published" && savedSlug && (
            <a
              href={`${WEBSITE_URL}/blog/${savedSlug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition"
            >
              <ExternalLink className="w-4 h-4" />
              View live
            </a>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {status === "published" ? "Save & update live" : "Save draft"}
          </button>
          {status === "published" ? (
            <button
              onClick={unpublish}
              disabled={saving}
              className="flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500/30 transition disabled:opacity-50"
            >
              <EyeOff className="w-4 h-4" />
              Unpublish
            </button>
          ) : (
            <button
              onClick={publish}
              disabled={saving || !postId}
              title={postId ? "" : "Save the draft first"}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition disabled:opacity-50"
            >
              <Globe className="w-4 h-4" />
              Publish
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-5">
          <div>
            <label className={labelCls}>Title * (becomes the H1)</label>
            <input value={form.title} onChange={setTitle} placeholder="How to help a child who is behind in math" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Slug *</label>
            <input value={form.slug} onChange={setSlug} placeholder="how-to-help-child-behind-in-math" className={inputCls} />
            <p className={hintCls}>
              {WEBSITE_URL}/blog/{form.slug || "your-slug"} · short, keyword-based, no dates. Keep it permanent once published.
            </p>
            {slugChangedAfterPublish && (
              <p className="text-yellow-400 text-xs mt-1">
                This post is live. Saving will change its URL; the old URL /blog/{savedSlug} will permanently redirect to the new one.
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Answer-first summary * (2–4 quotable sentences, shown first in the post)</label>
            <textarea
              value={form.answerFirstSummary}
              onChange={set("answerFirstSummary")}
              rows={4}
              placeholder="Directly answer the post's main question in plain, self-contained language."
              className={`${inputCls} resize-y`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <label className={labelCls}>Body * (Markdown)</label>
              <div className="flex gap-1">
                {["write", "split", "preview"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      view === v ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className={`grid gap-4 ${view === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {view !== "preview" && (
                <textarea
                  value={form.body}
                  onChange={set("body")}
                  rows={28}
                  placeholder={"## A section heading\n\nShort paragraphs...\n\n### A sub-heading\n\n- bullet point\n\n[see our online math tutoring](/online-math-tutoring)"}
                  className={`${inputCls} font-mono resize-y min-h-[20rem]`}
                />
              )}
              {view !== "write" && <MarkdownPreview markdown={form.body} />}
            </div>
            <p className={hintCls}>
              ## Heading 2 · ### Heading 3 · **bold** · - list · 1. numbered · [link text](/online-math-tutoring) ·
              tables with | pipes |. Don&apos;t use a single # heading — the title is the page&apos;s only H1.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>FAQ (optional — shown on the page and used for FAQ schema)</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, faq: [...f.faq, { question: "", answer: "" }] }))}
                className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add question
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {form.faq.map((item, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={item.question}
                      onChange={(e) => updateFaq(index, "question", e.target.value)}
                      placeholder="Question"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, faq: f.faq.filter((_, i) => i !== index) }))}
                      className="text-red-400 hover:text-red-300 px-2"
                      aria-label="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={item.answer}
                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                    rows={3}
                    placeholder="Direct answer"
                    className={`${inputCls} resize-y`}
                  />
                </div>
              ))}
              {form.faq.length === 0 && <p className="text-white/30 text-sm">No FAQ questions.</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white/70 text-sm font-semibold mb-3">Publishing checklist</p>
            <ul className="flex flex-col gap-1.5">
              {checks.map((check) => (
                <li key={check.label} className="flex items-center gap-2 text-sm">
                  {check.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  ) : (
                    <Circle className={`w-4 h-4 shrink-0 ${check.required ? "text-red-400" : "text-yellow-400"}`} />
                  )}
                  <span className={check.ok ? "text-white/70" : "text-white"}>
                    {check.label}
                    {check.required ? " *" : ""}
                  </span>
                </li>
              ))}
            </ul>
            <p className={hintCls}>* required to publish. Others are SEO/AEO recommendations from the blog spec.</p>
          </div>

          <BlogImageField
            label="Featured image *"
            value={form.featuredImage}
            onChange={(featuredImage) => setForm((f) => ({ ...f, featuredImage }))}
          />

          <div>
            <label className={labelCls}>Author *</label>
            <select value={form.author} onChange={set("author")} className={selectCls}>
              <option value="">Select an author</option>
              {authors.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Category *</label>
            <select value={form.category} onChange={set("category")} className={selectCls}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Funnel stage (internal only, never shown)</label>
            <select value={form.funnelStage} onChange={set("funnelStage")} className={selectCls}>
              <option value="top">Top — awareness</option>
              <option value="middle">Middle — consideration</option>
              <option value="bottom">Bottom — decision</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Tags (comma separated)</label>
            <input value={form.tags} onChange={set("tags")} placeholder="math, homework, grade 4" className={inputCls} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Meta title (falls back to title)</label>
              <Counter value={form.metaTitle} max={60} />
            </div>
            <input value={form.metaTitle} onChange={set("metaTitle")} className={inputCls} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Meta description *</label>
              <Counter value={form.metaDescription} min={140} max={160} />
            </div>
            <textarea value={form.metaDescription} onChange={set("metaDescription")} rows={3} className={`${inputCls} resize-y`} />
          </div>

          <div>
            <label className={labelCls}>Excerpt * (one-line card summary)</label>
            <textarea value={form.excerpt} onChange={set("excerpt")} rows={2} className={`${inputCls} resize-y`} />
          </div>

          <div>
            <label className={labelCls}>Related posts (up to 3 — otherwise picked from the same category)</label>
            <input
              value={relatedSearch}
              onChange={(e) => setRelatedSearch(e.target.value)}
              placeholder="Search posts…"
              className={`${inputCls} mb-2`}
            />
            <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
              {relatedOptions.map((p) => (
                <label key={p._id} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-white/5 rounded-md p-1">
                  <input
                    type="checkbox"
                    checked={form.relatedPosts.includes(p._id)}
                    onChange={() => toggleRelated(p._id)}
                    className="mt-1"
                  />
                  <span>
                    {p.title}
                    {p.status !== "published" && <span className="text-yellow-400 text-xs"> (draft)</span>}
                  </span>
                </label>
              ))}
              {relatedOptions.length === 0 && <p className="text-white/30 text-sm">No other posts yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostEditor;
