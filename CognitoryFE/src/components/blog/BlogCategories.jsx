import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Plus, Pencil, Trash2, Tags } from "lucide-react";
import { getBlogCategories, createBlogCategory, updateBlogCategory, deleteBlogCategory } from "../../services/blogAPIs";
import { successToast, errorToast } from "../toast/Toast";
import BlogModal from "./BlogModal";
import BlogImageField from "./BlogImageField";
import { SLUG_RE, toSlug, inputCls, labelCls, hintCls } from "./blogUtils";

const EMPTY_CATEGORY = {
  name: "",
  slug: "",
  description: "",
  featuredImage: { url: "", publicId: "", alt: "" },
  order: 0,
};

const CategoryForm = ({ category, onClose, onSaved }) => {
  const isNew = !category._id;
  const [form, setForm] = useState({
    ...EMPTY_CATEGORY,
    ...category,
    featuredImage: { ...EMPTY_CATEGORY.featuredImage, ...(category.featuredImage || {}) },
  });
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return errorToast("Name is required");
    if (!SLUG_RE.test(form.slug)) return errorToast("Slug must use lowercase letters, numbers and single hyphens");

    const payload = {
      name: form.name.trim(),
      slug: form.slug,
      description: form.description.trim(),
      featuredImage: form.featuredImage,
      order: Number(form.order) || 0,
    };

    setSaving(true);
    try {
      if (isNew) await createBlogCategory(payload);
      else await updateBlogCategory(category._id, payload);
      successToast(isNew ? "Category created" : "Category updated");
      onSaved();
      onClose();
    } catch {
      // error toast shown by service
    } finally {
      setSaving(false);
    }
  };

  return (
    <BlogModal title={isNew ? "New category" : "Edit category"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-white">
        <div>
          <label className={labelCls}>Name *</label>
          <input
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : toSlug(name) }));
            }}
            placeholder="Math & Science Help"
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
            placeholder="math-science"
            className={inputCls}
          />
          <p className={hintCls}>Category URL: /blog/category/{form.slug || "slug"}</p>
        </div>
        <div>
          <label className={labelCls}>Description (indexable intro shown at the top of the category page)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            className={`${inputCls} resize-y`}
          />
        </div>
        <BlogImageField
          label="Featured image"
          value={form.featuredImage}
          onChange={(featuredImage) => setForm((f) => ({ ...f, featuredImage }))}
        />
        <div>
          <label className={labelCls}>Display order</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
            className={inputCls}
          />
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
            {saving ? "Saving..." : "Save category"}
          </button>
        </div>
      </form>
    </BlogModal>
  );
};

const BlogCategories = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state?.user?.user?.role);
  const basePath = role === "super" ? "/super" : "/admin";
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setCategories(await getBlogCategories());
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      await deleteBlogCategory(category._id);
      successToast("Category deleted");
      fetchCategories();
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
          <Tags className="w-6 h-6" />
          <h1 className="text-xl font-bold">Blog categories</h1>
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition"
        >
          <Plus className="w-4 h-4" />
          New category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-center py-20 text-white/40">No categories yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category._id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <h3 className="font-semibold">{category.name}</h3>
              <p className="text-white/30 text-xs">
                {category.postCount} post{category.postCount === 1 ? "" : "s"} · /blog/category/{category.slug}
              </p>
              {category.description && <p className="text-white/50 text-xs line-clamp-3">{category.description}</p>}
              <div className="flex gap-3 pt-3 mt-auto border-t border-white/10">
                <button onClick={() => setEditing(category)} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button onClick={() => handleDelete(category)} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition ml-auto">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <CategoryForm category={editing} onClose={() => setEditing(null)} onSaved={fetchCategories} />}
    </div>
  );
};

export default BlogCategories;
