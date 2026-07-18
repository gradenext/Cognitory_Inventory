import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Plus, BookOpen, Layers, Trash2, Globe, Pencil } from "lucide-react";
import { getCourses, deleteCourse, publishCourse } from "../../services/courseAPIs";
import { successToast } from "../toast/Toast";
import CreateCourseModal from "./CreateCourseModal";
import EditCourseModal from "./EditCourseModal";

const TYPE_FILTERS = ["all", "standard", "ai"];
const STATUS_FILTERS = ["all", "draft", "published"];

const Courses = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state?.user?.user?.role);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    const data = await getCourses(
      typeFilter !== "all" ? typeFilter : null,
      statusFilter !== "all" ? statusFilter : null
    );
    setCourses(data?.courses || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, [typeFilter, statusFilter]);

  const handleDelete = async (e, courseId) => {
    e.stopPropagation();
    if (!confirm("Delete this course and all its content?")) return;
    try {
      await deleteCourse(courseId);
      successToast("Course deleted");
      fetchCourses();
    } catch {}
  };

  const handlePublish = async (e, courseId) => {
    e.stopPropagation();
    if (!confirm("Publish this course? It will become visible to students.")) return;
    try {
      await publishCourse(courseId);
      successToast("Course published");
      fetchCourses();
    } catch {}
  };

  const basePath = role === "super" ? "/super" : "/admin";

  return (
    <div className="p-4 md:p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          <h1 className="text-xl font-bold">Programming Courses</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition"
        >
          <Plus className="w-4 h-4" />
          New Course
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Type filter */}
        <div className="flex gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                typeFilter === f
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {f === "all" ? "All Types" : f === "ai" ? "AI-Based" : "Standard"}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                statusFilter === f
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {f === "all" ? "All Status" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No courses found. Create your first course.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course._id}
              onClick={() => navigate(`${basePath}/courses/${course._id}`)}
              className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 hover:border-white/30 transition group"
            >
              {/* Type + Status badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  course.type === "ai"
                    ? "bg-purple-500/30 text-purple-300"
                    : "bg-blue-500/30 text-blue-300"
                }`}>
                  {course.type === "ai" ? "AI-Based" : "Standard"}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  course.status === "published"
                    ? "bg-green-500/30 text-green-300"
                    : "bg-yellow-500/30 text-yellow-300"
                }`}>
                  {course.status === "published" ? "Published" : "Draft"}
                </span>
              </div>

              <h3 className="text-white font-semibold mb-1 group-hover:text-white/90">
                {course.title}
              </h3>
              {course.description && (
                <p className="text-white/50 text-xs mb-3 line-clamp-2">{course.description}</p>
              )}

              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {/* modules count not in list response, just show created time */}
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                {course.status === "draft" && (
                  <button
                    onClick={(e) => handlePublish(e, course._id)}
                    className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Publish
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditCourse(course); }}
                  className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={(e) => handleDelete(e, course._id)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchCourses}
        />
      )}
      {editCourse && (
        <EditCourseModal
          course={editCourse}
          onClose={() => setEditCourse(null)}
          onSuccess={fetchCourses}
        />
      )}
    </div>
  );
};

export default Courses;
