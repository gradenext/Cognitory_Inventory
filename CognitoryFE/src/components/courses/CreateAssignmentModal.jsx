import { useState } from "react";
import { createAssignment } from "../../services/courseAPIs";
import { successToast, errorToast } from "../toast/Toast";

const CreateAssignmentModal = ({ courseId, onClose, onSuccess }) => {
  const [form, setForm] = useState({ title: "", description: "", order: 0 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return errorToast("Title is required");
    setLoading(true);
    try {
      await createAssignment(courseId, { ...form, order: Number(form.order) });
      successToast("Assignment created. Upload the file next.");
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
        <h2 className="text-white text-xl font-bold mb-2">Add Assignment</h2>
        <p className="text-white/50 text-sm mb-4">Create the assignment entry first, then upload the PDF or PPT.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white/70 text-sm mb-1 block">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Assignment 1: Hello World"
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does this assignment cover?"
              rows={3}
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white resize-none"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm mb-1 block">Order</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-white/30 text-white rounded-lg py-2 text-sm hover:bg-white/10 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-white text-black rounded-lg py-2 text-sm font-semibold hover:bg-white/90 transition disabled:opacity-50">
              {loading ? "Adding..." : "Add Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
