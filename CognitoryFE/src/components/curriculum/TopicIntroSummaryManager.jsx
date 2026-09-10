import React, { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Upload, Trash2, FileText, Edit2, Check, X, RefreshCw, Image } from "lucide-react";
import {
  getTopicIntroSummaries,
  createTopicIntroSummary,
  uploadTopicIntroSummaryFile,
  updateTopicIntroSummary,
  deleteTopicIntroSummary,
} from "../../services/topicIntroSummaryAPIs";

const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp"];

const FILE_TYPE_COLORS = {
  pdf:  { bg: "rgba(239,68,68,0.15)",  color: "#fca5a5" },
  ppt:  { bg: "rgba(249,115,22,0.15)", color: "#fed7aa" },
  pptx: { bg: "rgba(249,115,22,0.15)", color: "#fed7aa" },
  jpg:  { bg: "rgba(34,197,94,0.15)",  color: "#86efac" },
  jpeg: { bg: "rgba(34,197,94,0.15)",  color: "#86efac" },
  png:  { bg: "rgba(34,197,94,0.15)",  color: "#86efac" },
  gif:  { bg: "rgba(34,197,94,0.15)",  color: "#86efac" },
  webp: { bg: "rgba(34,197,94,0.15)",  color: "#86efac" },
};

const TopicIntroSummaryManager = ({ topicId }) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState({});
  const [deleting, setDeleting] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const fileRefs = useRef({});

  const fetchSummaries = async () => {
    setLoading(true);
    const data = await getTopicIntroSummaries(topicId);
    setSummaries(data?.summaries || []);
    setLoading(false);
  };

  useEffect(() => { fetchSummaries(); }, [topicId]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createTopicIntroSummary(topicId, { title: newTitle.trim() });
      setNewTitle("");
      await fetchSummaries();
    } catch (_) {}
    setCreating(false);
  };

  const handleUpload = async (summaryId, file) => {
    if (!file) return;
    setUploading((p) => ({ ...p, [summaryId]: true }));
    try {
      await uploadTopicIntroSummaryFile(topicId, summaryId, file);
      await fetchSummaries();
    } catch (_) {}
    setUploading((p) => ({ ...p, [summaryId]: false }));
    if (fileRefs.current[summaryId]) fileRefs.current[summaryId].value = "";
  };

  const handleDelete = async (summaryId) => {
    if (!window.confirm("Delete this intro summary?")) return;
    setDeleting((p) => ({ ...p, [summaryId]: true }));
    try {
      await deleteTopicIntroSummary(topicId, summaryId);
      await fetchSummaries();
    } catch (_) {}
    setDeleting((p) => ({ ...p, [summaryId]: false }));
  };

  const handleEditSave = async (summaryId) => {
    if (!editTitle.trim()) return;
    try {
      await updateTopicIntroSummary(topicId, summaryId, { title: editTitle.trim() });
      setEditingId(null);
      await fetchSummaries();
    } catch (_) {}
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Info banner ── */}
      <div className="rounded-xl px-4 py-3 text-sm"
        style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc" }}>
        These files appear in the <strong>Topic Introduction modal</strong> when a student starts a quiz session on this topic. Upload a PDF, image, or PPT that summarises the topic.
      </div>

      {/* ── Create new item ── */}
      <div className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Add Summary</p>
        <input
          type="text"
          placeholder="Title (e.g. Addition — Visual Summary)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/10 border border-white/10 outline-none focus:border-indigo-400 placeholder:text-white/30"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newTitle.trim()}
          className="cursor-pointer self-start flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-40"
          style={{ background: "rgba(99,102,241,0.3)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.4)" }}>
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {creating ? "Creating…" : "Create"}
        </button>
      </div>

      {/* ── Summary list ── */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={28} className="animate-spin text-white/30" />
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={36} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40 text-sm">No summaries yet. Create one above, then upload a PDF or image.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {summaries.map((s) => {
            const ft = s.file?.fileType?.toLowerCase();
            const ftStyle = FILE_TYPE_COLORS[ft];
            const hasFile = !!s.file?.url;
            const isImage = IMAGE_TYPES.includes(ft);
            const isUploading = uploading[s._id];
            const isDeleting = deleting[s._id];
            const isEditing = editingId === s._id;

            return (
              <div key={s._id} className="rounded-xl p-3.5 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>

                {/* Icon / image thumbnail */}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: ftStyle ? ftStyle.bg : "rgba(255,255,255,0.07)" }}>
                  {hasFile && isImage ? (
                    <img src={s.file?.url} alt={s.title} className="w-full h-full object-cover" />
                  ) : isImage ? (
                    <Image size={15} style={{ color: "rgba(255,255,255,0.25)" }} />
                  ) : (
                    <FileText size={15} style={{ color: ftStyle ? ftStyle.color : "rgba(255,255,255,0.25)" }} />
                  )}
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
                          if (e.key === "Enter") handleEditSave(s._id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 rounded-md px-2 py-1 text-sm text-white bg-white/10 border border-indigo-400 outline-none"
                      />
                      <button onClick={() => handleEditSave(s._id)} className="cursor-pointer text-green-400 hover:text-green-300"><Check size={13} /></button>
                      <button onClick={() => setEditingId(null)} className="cursor-pointer text-white/30 hover:text-white/50"><X size={13} /></button>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-white truncate">{s.title}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {hasFile
                      ? <span className="text-xs font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{ background: ftStyle?.bg, color: ftStyle?.color }}>{ft}</span>
                      : <span className="text-xs text-amber-400/80">No file — click Upload</span>
                    }
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isEditing && (
                    <button
                      onClick={() => { setEditingId(s._id); setEditTitle(s.title); }}
                      className="cursor-pointer p-1.5 rounded-lg text-white/30 hover:text-white/70 transition"
                      title="Edit title">
                      <Edit2 size={13} />
                    </button>
                  )}

                  <button
                    onClick={() => fileRefs.current[s._id]?.click()}
                    disabled={isUploading}
                    className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40"
                    style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
                    {isUploading
                      ? <Loader2 size={12} className="animate-spin" />
                      : hasFile ? <RefreshCw size={12} /> : <Upload size={12} />}
                    {isUploading ? "Uploading…" : hasFile ? "Replace" : "Upload"}
                  </button>
                  <input
                    ref={(el) => (fileRefs.current[s._id] = el)}
                    type="file"
                    accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                    className="hidden"
                    onChange={(e) => handleUpload(s._id, e.target.files?.[0])}
                  />

                  <button
                    onClick={() => handleDelete(s._id)}
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

export default TopicIntroSummaryManager;
