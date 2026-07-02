import { useState } from "react";
import { updateModule, updateLesson, updateAssignment } from "../../services/courseAPIs";
import { successToast, errorToast } from "../toast/Toast";

const LABELS = {
  module: "Edit Module",
  lesson: "Edit Lesson",
  assignment: "Edit Assignment",
};

const EditItemModal = ({ type, item, courseId, moduleId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: item.title || "",
    description: item.description || "",
    order: item.order ?? 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return errorToast("Title is required");
    setLoading(true);
    try {
      const payload = { ...form, order: Number(form.order) };
      if (type === "module") {
        await updateModule(courseId, item._id, payload);
      } else if (type === "lesson") {
        await updateLesson(courseId, moduleId, item._id, payload);
      } else {
        await updateAssignment(courseId, item._id, payload);
      }
      successToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated`);
      onSuccess();
      onClose();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 className="text-white text-xl font-bold mb-5">{LABELS[type]}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white/70 text-sm mb-1 block">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white resize-none"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm mb-1 block">Display Order</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
            />
          </div>

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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;
