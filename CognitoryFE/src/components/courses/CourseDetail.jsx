import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp,
  Upload, FileText, Globe, ClipboardList, Layers, Pencil,
} from "lucide-react";
import {
  getCourseById, deleteModule, deleteLesson,
  uploadLessonFile, publishCourse,
  getCourseAssignments, deleteAssignment,
  publishAssignment, uploadAssignmentFile,
} from "../../services/courseAPIs";
import { successToast, errorToast } from "../toast/Toast";
import CreateModuleModal from "./CreateModuleModal";
import CreateLessonModal from "./CreateLessonModal";
import CreateAssignmentModal from "./CreateAssignmentModal";
import EditItemModal from "./EditItemModal";

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("modules"); // "modules" | "assignments"
  const [expandedModules, setExpandedModules] = useState({});
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editItem, setEditItem] = useState(null); // { type, item, moduleId? }
  const [uploadingLesson, setUploadingLesson] = useState(null);
  const [uploadingAssignment, setUploadingAssignment] = useState(null);
  const lessonFileRef = useRef(null);
  const assignmentFileRef = useRef(null);
  const activeLesson = useRef(null);
  const activeAssignment = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    const [courseData, assignmentData] = await Promise.all([
      getCourseById(courseId),
      getCourseAssignments(courseId),
    ]);
    setData(courseData);
    setAssignments(assignmentData?.assignments || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [courseId]);

  const toggleModule = (id) => setExpandedModules((p) => ({ ...p, [id]: !p[id] }));

  const handleDeleteModule = async (moduleId) => {
    if (!confirm("Delete this module and all its lessons?")) return;
    try { await deleteModule(courseId, moduleId); successToast("Module deleted"); fetchData(); } catch {}
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!confirm("Delete this lesson?")) return;
    try { await deleteLesson(courseId, moduleId, lessonId); successToast("Lesson deleted"); fetchData(); } catch {}
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm("Delete this assignment?")) return;
    try { await deleteAssignment(courseId, assignmentId); successToast("Assignment deleted"); fetchData(); } catch {}
  };

  const handlePublishAssignment = async (assignmentId) => {
    if (!confirm("Publish this assignment? It will sync to GradeNext.")) return;
    try { await publishAssignment(courseId, assignmentId); successToast("Assignment published"); fetchData(); } catch {}
  };

  // Lesson file upload
  const handleLessonUploadClick = (lessonId) => {
    activeLesson.current = lessonId;
    lessonFileRef.current.click();
  };
  const handleLessonFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeLesson.current) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "ppt", "pptx"].includes(ext)) return errorToast("Only PDF, PPT, PPTX allowed");
    setUploadingLesson(activeLesson.current);
    try { await uploadLessonFile(activeLesson.current, file); successToast("File uploaded"); fetchData(); }
    catch {} finally { setUploadingLesson(null); activeLesson.current = null; e.target.value = ""; }
  };

  // Assignment file upload
  const handleAssignmentUploadClick = (assignmentId) => {
    activeAssignment.current = assignmentId;
    assignmentFileRef.current.click();
  };
  const handleAssignmentFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeAssignment.current) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "ppt", "pptx"].includes(ext)) return errorToast("Only PDF, PPT, PPTX allowed");
    setUploadingAssignment(activeAssignment.current);
    try { await uploadAssignmentFile(activeAssignment.current, file); successToast("File uploaded"); fetchData(); }
    catch {} finally { setUploadingAssignment(null); activeAssignment.current = null; e.target.value = ""; }
  };

  const handlePublishCourse = async () => {
    if (!confirm("Publish this course? It will become visible to students.")) return;
    try { await publishCourse(courseId); successToast("Course published"); fetchData(); } catch {}
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!data) return <div className="p-6 text-white/60 text-center">Course not found.</div>;

  const { course, modules } = data;

  return (
    <div className="p-4 md:p-6 text-white">
      <input ref={lessonFileRef} type="file" accept=".pdf,.ppt,.pptx" className="hidden" onChange={handleLessonFileChange} />
      <input ref={assignmentFileRef} type="file" accept=".pdf,.ppt,.pptx" className="hidden" onChange={handleAssignmentFileChange} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{course.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.type === "ai" ? "bg-purple-500/30 text-purple-300" : "bg-blue-500/30 text-blue-300"}`}>
                {course.type === "ai" ? "AI-Based" : "Standard"}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.status === "published" ? "bg-green-500/30 text-green-300" : "bg-yellow-500/30 text-yellow-300"}`}>
                {course.status === "published" ? "Published" : "Draft"}
              </span>
            </div>
            {course.description && <p className="text-white/60 text-sm mt-1">{course.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {course.status === "draft" && (
            <button onClick={handlePublishCourse} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <Globe className="w-4 h-4" /> Publish Course
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/10 pb-0">
        <button
          onClick={() => setActiveTab("modules")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition border-b-2 ${activeTab === "modules" ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/70"}`}
        >
          <Layers className="w-4 h-4" /> Modules
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition border-b-2 ${activeTab === "assignments" ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/70"}`}
        >
          <ClipboardList className="w-4 h-4" /> Assignments
          {assignments.length > 0 && (
            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{assignments.length}</span>
          )}
        </button>
      </div>

      {/* ── Modules Tab ── */}
      {activeTab === "modules" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowModuleModal(true)} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition">
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>

          {modules.length === 0 ? (
            <div className="text-center py-16 text-white/40">No modules yet. Add your first module.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {modules.map((mod, idx) => (
                <div key={mod._id} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-white/5">
                    <button className="flex items-center gap-3 flex-1 text-left" onClick={() => toggleModule(mod._id)}>
                      <span className="text-white/40 text-sm w-6">{idx + 1}.</span>
                      <div>
                        <p className="text-white font-medium text-sm">{mod.title}</p>
                        {mod.description && <p className="text-white/50 text-xs">{mod.description}</p>}
                      </div>
                      <span className="text-white/40 text-xs ml-2">{mod.lessons?.length || 0} lesson{(mod.lessons?.length || 0) !== 1 ? "s" : ""}</span>
                    </button>
                    <div className="flex items-center gap-2 ml-3">
                      <button onClick={() => setShowLessonModal(mod._id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition" title="Add Lesson">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditItem({ type: "module", item: mod })} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition" title="Edit Module">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteModule(mod._id)} className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleModule(mod._id)}>
                        {expandedModules[mod._id] ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                      </button>
                    </div>
                  </div>

                  {expandedModules[mod._id] && (
                    <div className="border-t border-white/10">
                      {(mod.lessons || []).length === 0 ? (
                        <p className="text-white/40 text-sm text-center py-4">No lessons yet.</p>
                      ) : (
                        (mod.lessons || []).map((lesson, lIdx) => (
                          <div key={lesson._id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-white/30 text-xs w-5 shrink-0">{idx + 1}.{lIdx + 1}</span>
                              <div className="min-w-0">
                                <p className="text-white text-sm truncate">{lesson.title}</p>
                                {lesson.file?.url ? (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <FileText className="w-3 h-3 text-green-400" />
                                    <span className="text-green-400 text-xs">{lesson.file.originalName} ({lesson.file.fileType?.toUpperCase()})</span>
                                  </div>
                                ) : (
                                  <span className="text-white/30 text-xs">No file uploaded</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3 shrink-0">
                              <button onClick={() => handleLessonUploadClick(lesson._id)} disabled={uploadingLesson === lesson._id} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50">
                                {uploadingLesson === lesson._id ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => setEditItem({ type: "lesson", item: lesson, moduleId: mod._id })} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition" title="Edit Lesson">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteLesson(mod._id, lesson._id)} className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Assignments Tab ── */}
      {activeTab === "assignments" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAssignmentModal(true)} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition">
              <Plus className="w-4 h-4" /> Add Assignment
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No assignments yet. Add the first one.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {assignments.map((asgn, idx) => (
                <div key={asgn._id} className="border border-white/10 rounded-xl px-4 py-3 bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-white/40 text-sm w-6 shrink-0 mt-0.5">{idx + 1}.</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-medium text-sm">{asgn.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${asgn.status === "published" ? "bg-green-500/30 text-green-300" : "bg-yellow-500/30 text-yellow-300"}`}>
                            {asgn.status === "published" ? "Published" : "Draft"}
                          </span>
                        </div>
                        {asgn.description && <p className="text-white/50 text-xs mt-0.5">{asgn.description}</p>}
                        {asgn.file?.url ? (
                          <div className="flex items-center gap-1 mt-1">
                            <FileText className="w-3 h-3 text-green-400" />
                            <span className="text-green-400 text-xs">{asgn.file.originalName} ({asgn.file.fileType?.toUpperCase()})</span>
                          </div>
                        ) : (
                          <span className="text-orange-400/70 text-xs mt-1 block">No file uploaded</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleAssignmentUploadClick(asgn._id)} disabled={uploadingAssignment === asgn._id} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50" title="Upload file">
                        {uploadingAssignment === asgn._id ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditItem({ type: "assignment", item: asgn })} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition" title="Edit Assignment">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {asgn.status === "draft" && (
                        <button onClick={() => handlePublishAssignment(asgn._id)} className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition" title="Publish">
                          <Globe className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDeleteAssignment(asgn._id)} className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showModuleModal && <CreateModuleModal courseId={courseId} onClose={() => setShowModuleModal(false)} onSuccess={fetchData} />}
      {showLessonModal && <CreateLessonModal courseId={courseId} moduleId={showLessonModal} onClose={() => setShowLessonModal(null)} onSuccess={fetchData} />}
      {showAssignmentModal && <CreateAssignmentModal courseId={courseId} onClose={() => setShowAssignmentModal(false)} onSuccess={fetchData} />}
      {editItem && (
        <EditItemModal
          type={editItem.type}
          item={editItem.item}
          courseId={courseId}
          moduleId={editItem.moduleId}
          onClose={() => setEditItem(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default CourseDetail;
