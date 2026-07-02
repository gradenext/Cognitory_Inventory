import React, { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Upload, Trash2, FileText, Edit2, Check, X, RefreshCw } from "lucide-react";
import {
  getTopicContents,
  createTopicContent,
  updateTopicContent,
  uploadTopicContentFile,
  deleteTopicContent,
} from "../../services/topicContentAPIs";

const FILE_TYPE_COLORS = {
  pdf:  { bg: "rgba(239,68,68,0.15)",   color: "#fca5a5" },
  ppt:  { bg: "rgba(249,115,22,0.15)",  color: "#fed7aa" },
  pptx: { bg: "rgba(249,115,22,0.15)",  color: "#fed7aa" },
};

const TopicContentManager = ({ topicId }) => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState({});
  const [deleting, setDeleting] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const fileRefs = useRef({});

  const fetchContents = async () => {
    setLoading(true);
    const data = await getTopicContents(topicId);
    setContents(data?.contents || []);
    setLoading(false);
  };

  useEffect(() => { fetchContents(); }, [topicId]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createTopicContent(topicId, { title: newTitle.trim(), description: newDesc.trim() });
      setNewTitle("");
      setNewDesc("");
      await fetchContents();
    } catch (_) {}
    setCreating(false);
  };

  const handleUpload = async (contentId, file) => {
    if (!file) return;
    setUploading((p) => ({ ...p, [contentId]: true }));
    try {
      await uploadTopicContentFile(topicId, contentId, file);
      await fetchContents();
    } catch (_) {}
    setUploading((p) => ({ ...p, [contentId]: false }));
    if (fileRefs.current[contentId]) fileRefs.current[contentId].value = "";
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm("Delete this content item?")) return;
    setDeleting((p) => ({ ...p, [contentId]: true }));
    try {
      await deleteTopicContent(topicId, contentId);
      await fetchContents();
    } catch (_) {}
    setDeleting((p) => ({ ...p, [contentId]: false }));
  };

  const handleEditSave = async (contentId) => {
    if (!editTitle.trim()) return;
    try {
      await updateTopicContent(topicId, contentId, { title: editTitle.trim() });
      setEditingId(null);
      await fetchContents();
    } catch (_) {}
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Create new item ── */}
      <div className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Add Content</p>
        <input
          type="text"
          placeholder="Title (e.g. Chapter 3 Notes)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/10 border border-white/10 outline-none focus:border-indigo-400 placeholder:text-white/30"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/10 border border-white/10 outline-none focus:border-indigo-400 placeholder:text-white/30"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newTitle.trim()}
          className="cursor-pointer self-start flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-40"
          style={{ background: "rgba(99,102,241,0.3)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.4)" }}>
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {creating ? "Creating…" : "Create Item"}
        </button>
      </div>

      {/* ── Content list ── */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={28} className="animate-spin text-white/30" />
        </div>
      ) : contents.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={36} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40 text-sm">No content yet. Create an item above, then upload a file to it.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {contents.map((c) => {
            const ft = c.file?.fileType?.toLowerCase();
            const ftStyle = FILE_TYPE_COLORS[ft];
            const hasFile = !!c.file?.url;
            const isUploading = uploading[c._id];
            const isDeleting = deleting[c._id];
            const isEditing = editingId === c._id;

            return (
              <div key={c._id} className="rounded-xl p-3.5 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>

                {/* Icon */}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: ftStyle ? ftStyle.bg : "rgba(255,255,255,0.07)" }}>
                  <FileText size={15} style={{ color: ftStyle ? ftStyle.color : "rgba(255,255,255,0.25)" }} />
                </div>

                {/* Title + status */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEditSave(c._id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 rounded-md px-2 py-1 text-sm text-white bg-white/10 border border-indigo-400 outline-none"
                      />
                      <button onClick={() => handleEditSave(c._id)} className="cursor-pointer text-green-400 hover:text-green-300"><Check size={13} /></button>
                      <button onClick={() => setEditingId(null)} className="cursor-pointer text-white/30 hover:text-white/50"><X size={13} /></button>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {hasFile
                      ? <span className="text-xs font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{ background: ftStyle?.bg, color: ftStyle?.color }}>{ft}</span>
                      : <span className="text-xs text-amber-400/80">No file — click Upload</span>
                    }
                    {c.description && <span className="text-xs text-white/25 truncate">{c.description}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Edit title */}
                  {!isEditing && (
                    <button
                      onClick={() => { setEditingId(c._id); setEditTitle(c.title); }}
                      className="cursor-pointer p-1.5 rounded-lg text-white/30 hover:text-white/70 transition"
                      title="Edit title">
                      <Edit2 size={13} />
                    </button>
                  )}

                  {/* Upload / Replace file */}
                  <button
                    onClick={() => fileRefs.current[c._id]?.click()}
                    disabled={isUploading}
                    className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40"
                    style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
                    {isUploading
                      ? <Loader2 size={12} className="animate-spin" />
                      : hasFile ? <RefreshCw size={12} /> : <Upload size={12} />}
                    {isUploading ? "Uploading…" : hasFile ? "Replace" : "Upload"}
                  </button>
                  <input
                    ref={(el) => (fileRefs.current[c._id] = el)}
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    className="hidden"
                    onChange={(e) => handleUpload(c._id, e.target.files?.[0])}
                  />

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(c._id)}
                    disabled={isDeleting}
                    className="cursor-pointer p-1.5 rounded-lg text-red-400/50 hover:text-red-400 transition disabled:opacity-40"
                    title="Delete">
                    {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopicContentManager;
