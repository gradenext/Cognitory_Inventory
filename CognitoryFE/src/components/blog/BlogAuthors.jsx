import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Plus, Pencil, Trash2, Users } from "lucide-react";
import { getBlogAuthors, createBlogAuthor, updateBlogAuthor, deleteBlogAuthor } from "../../services/blogAPIs";
import { successToast, errorToast } from "../toast/Toast";
import BlogModal from "./BlogModal";
import BlogImageField from "./BlogImageField";
import { SLUG_RE, toSlug, inputCls, labelCls, hintCls } from "./blogUtils";

const EMPTY_AUTHOR = {
  name: "",
  slug: "",
  role: "",
  credentials: "",
  bio: "",
  photo: { url: "", publicId: "", alt: "" },
  socialLinks: { linkedin: "", x: "", website: "" },
  order: 0,
};

const AuthorForm = ({ author, onClose, onSaved }) => {
  const isNew = !author._id;
  const [form, setForm] = useState({
    ...EMPTY_AUTHOR,
    ...author,
    photo: { ...EMPTY_AUTHOR.photo, ...(author.photo || {}) },
    socialLinks: { ...EMPTY_AUTHOR.socialLinks, ...(author.socialLinks || {}) },
  });
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setSocial = (field) => (e) =>
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [field]: e.target.value.trim() } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return errorToast("Name is required");
    if (!SLUG_RE.test(form.slug)) return errorToast("Slug must use lowercase letters, numbers and single hyphens");

    const payload = {
      name: form.name.trim(),
      slug: form.slug,
      role: form.role.trim(),
      credentials: form.credentials.trim(),
      bio: form.bio.trim(),
      photo: form.photo,
      socialLinks: form.socialLinks,
      order: Number(form.order) || 0,
    };

    setSaving(true);
    try {
      if (isNew) await createBlogAuthor(payload);
      else await updateBlogAuthor(author._id, payload);
      successToast(isNew ? "Author created" : "Author updated");
      onSaved();
      onClose();
    } catch {
      // error toast shown by service
    } finally {
      setSaving(false);
    }
  };

  return (
    <BlogModal title={isNew ? "New author" : "Edit author"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-white">
        <div>
          <label className={labelCls}>Name *</label>
          <input
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : toSlug(name) }));
            }}
            placeholder="Shahid Mohammad, PhD"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Slug *</label>
          <input
            value={form.slug}
            onChange={(e) => {
              setSlugEdited(true);
              setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }));
            }}
            placeholder="shahid-mohammad"
            className={inputCls}
          />
          <p className={hintCls}>Profile URL: /blog/author/{form.slug || "slug"}</p>
        </div>
        <div>
          <label className={labelCls}>Role</label>
          <input value={form.role} onChange={set("role")} placeholder="Founder & CEO" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Credentials</label>
          <input
            value={form.credentials}
            onChange={set("credentials")}
            placeholder="Neuroscientist, 20+ yrs child development"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Bio (2–3 sentences with credentials)</label>
          <textarea value={form.bio} onChange={set("bio")} rows={4} className={`${inputCls} resize-y`} />
        </div>
        <BlogImageField
          label="Photo (real headshot)"
          value={form.photo}
          onChange={(photo) => setForm((f) => ({ ...f, photo }))}
        />
        <div>
          <label className={labelCls}>LinkedIn URL</label>
          <input value={form.socialLinks.linkedin} onChange={setSocial("linkedin")} placeholder="https://www.linkedin.com/in/…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>X (Twitter) URL</label>
          <input value={form.socialLinks.x} onChange={setSocial("x")} placeholder="https://x.com/…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Website URL</label>
          <input value={form.socialLinks.website} onChange={setSocial("website")} placeholder="https://…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Display order</label>
          <input type="number" value={form.order} onChange={set("order")} className={inputCls} />
        </div>
        <div className="flex gap-3 mt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-white/30 rounded-lg py-2 text-sm hover:bg-white/10 transition">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-white text-black rounded-lg py-2 text-sm font-semibold hover:bg-white/90 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save author"}
          </button>
        </div>
      </form>
    </BlogModal>
  );
};

const BlogAuthors = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state?.user?.user?.role);
  const basePath = role === "super" ? "/super" : "/admin";
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchAuthors = async () => {
    setLoading(true);
    setAuthors(await getBlogAuthors());
    setLoading(false);
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleDelete = async (author) => {
    if (!confirm(`Delete author "${author.name}"?`)) return;
    try {
      await deleteBlogAuthor(author._id);
      successToast("Author deleted");
      fetchAuthors();
    } catch {
      // error toast shown by service
    }
  };

  return (
    <div className="p-4 md:p-6 text-white w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`${basePath}/blog`)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition" aria-label="Back to posts">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Users className="w-6 h-6" />
          <h1 className="text-xl font-bold">Blog authors</h1>
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition"
        >
          <Plus className="w-4 h-4" />
          New author
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : authors.length === 0 ? (
        <p className="text-center py-20 text-white/40">No authors yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map((author) => (
            <div key={author._id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {author.photo?.url ? (
                  <img src={author.photo.url} alt={author.photo.alt || author.name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/10" />
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{author.name}</h3>
                  <p className="text-white/50 text-xs truncate">{author.role}</p>
                  <p className="text-white/30 text-xs">
                    {author.postCount} post{author.postCount === 1 ? "" : "s"} · /blog/author/{author.slug}
                  </p>
                </div>
              </div>
              {author.bio && <p className="text-white/50 text-xs line-clamp-3">{author.bio}</p>}
              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button onClick={() => setEditing(author)} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button onClick={() => handleDelete(author)} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition ml-auto">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <AuthorForm author={editing} onClose={() => setEditing(null)} onSaved={fetchAuthors} />}
    </div>
  );
};

export default BlogAuthors;
