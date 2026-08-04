import { useState } from "react";
import { createCourse } from "../../services/courseAPIs";
import { successToast, errorToast } from "../toast/Toast";

const CreateCourseModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    type: "standard",
    description: "",
    order: 0,
    priceUsd: "",
    stripe_product_id: "",
    stripe_price_id: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return errorToast("Title is required");
    if (form.priceUsd !== "" && isNaN(Number(form.priceUsd)))
      return errorToast("Price must be a valid number");

    setLoading(true);
    try {
      await createCourse({
        title: form.title,
        type: form.type,
        description: form.description,
        order: Number(form.order),
        price: form.priceUsd !== "" ? Math.round(Number(form.priceUsd) * 100) : 0,
        stripe_product_id: form.stripe_product_id.trim(),
        stripe_price_id: form.stripe_price_id.trim(),
      });
      successToast("Course created successfully");
      onSuccess();
      onClose();
    } catch {
      // error toast already shown in service
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white placeholder-white/30";
  const labelCls = "text-white/70 text-sm mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-white text-xl font-bold mb-5">Create New Course</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Title */}
          <div>
            <label className={labelCls}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Python Fundamentals"
              className={inputCls}
            />
          </div>

          {/* Type */}
          <div>
            <label className={labelCls}>Type *</label>
            <select
              value={form.type}
              onChange={set("type")}
              className="w-full bg-black text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
            >
              <option value="standard">Standard</option>
              <option value="ai">AI-Based</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Brief description of the course..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Display Order */}
          <div>
            <label className={labelCls}>Display Order</label>
            <input
              type="number"
              value={form.order}
              onChange={set("order")}
              className={inputCls}
            />
          </div>

          {/* ── Pricing & Stripe ── */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
              Pricing &amp; Stripe
            </p>

            <div className="flex flex-col gap-4">

              {/* Price */}
              <div>
                <label className={labelCls}>Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.priceUsd}
                    onChange={set("priceUsd")}
                    placeholder="4.99"
                    className={`${inputCls} pl-7`}
                  />
                </div>
                <p className="text-white/30 text-xs mt-1">
                  Leave blank to mark as "not yet priced". Stored as cents internally.
                </p>
              </div>

              {/* Stripe Product ID */}
              <div>
                <label className={labelCls}>Stripe Product ID</label>
                <input
                  type="text"
                  value={form.stripe_product_id}
                  onChange={set("stripe_product_id")}
                  placeholder="prod_xxxxxxxxxxxxxxxxxx"
                  className={inputCls}
                />
              </div>

              {/* Stripe Price ID */}
              <div>
                <label className={labelCls}>Stripe Price ID</label>
                <input
                  type="text"
                  value={form.stripe_price_id}
                  onChange={set("stripe_price_id")}
                  placeholder="price_xxxxxxxxxxxxxxxxxx"
                  className={inputCls}
                />
                <p className="text-white/30 text-xs mt-1">
                  Required for the Stripe checkout to work. Create a one-time price in your Stripe dashboard first.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/30 text-white rounded-lg py-2 text-sm hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-black rounded-lg py-2 text-sm font-semibold hover:bg-white/90 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseModal;
