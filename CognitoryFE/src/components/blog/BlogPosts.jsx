import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Plus, Newspaper, Users, Tags, Globe, EyeOff, Pencil, Trash2, ExternalLink } from "lucide-react";
import { getBlogPosts, publishBlogPost, unpublishBlogPost, deleteBlogPost } from "../../services/blogAPIs";
import { successToast } from "../toast/Toast";
import { WEBSITE_URL, formatDate, inputCls } from "./blogUtils";

const STATUS_FILTERS = ["all", "draft", "published"];

const BlogPosts = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state?.user?.user?.role);
  const basePath = role === "super" ? "/super" : "/admin";

  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const fetchPosts = async () => {
    setLoading(true);
    const data = await getBlogPosts({
      page,
      limit: 20,
      status: status === "all" ? undefined : status,
      q: query.trim() || undefined,
    });
    setPosts(data?.posts || []);
    setPagination(data?.pagination || null);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchPosts, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [status, query, page]);

  const act = async (fn, message) => {
    try {
      await fn();
      successToast(message);
      fetchPosts();
    } catch {
      // error toast shown by service
    }
  };

  const handlePublish = (post) => {
    if (!confirm(`Publish "${post.title}" on gradenext.com?`)) return;
    act(() => publishBlogPost(post._id), "Post published");
  };

  const handleUnpublish = (post) => {
    if (!confirm(`Move "${post.title}" back to drafts? It will disappear from gradenext.com.`)) return;
    act(() => unpublishBlogPost(post._id), "Post moved to drafts");
  };

  const handleDelete = (post) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    act(() => deleteBlogPost(post._id), "Post deleted");
  };

  return (
    <div className="p-4 md:p-6 text-white w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Newspaper className="w-6 h-6" />
          <h1 className="text-xl font-bold">Blog</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to={`${basePath}/blog/authors`}
            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition"
          >
            <Users className="w-4 h-4" />
            Authors
          </Link>
          <Link
            to={`${basePath}/blog/categories`}
            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition"
          >
            <Tags className="w-4 h-4" />
            Categories
          </Link>
          <Link
            to={`${basePath}/blog/new`}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => {
                setStatus(f);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                status === f ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by title…"
          className={`${inputCls} max-w-xs`}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No posts found. Write your first post.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/30 transition flex flex-col md:flex-row md:items-center gap-3"
            >
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`${basePath}/blog/posts/${post._id}`)}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      post.status === "published" ? "bg-green-500/30 text-green-300" : "bg-yellow-500/30 text-yellow-300"
                    }`}
                  >
                    {post.status === "published" ? "Published" : "Draft"}
                  </span>
                  {post.category?.name && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300">
                      {post.category.name}
                    </span>
                  )}
                  <span className="text-xs text-white/40 uppercase">{post.funnelStage} funnel</span>
                </div>
                <h3 className="font-semibold truncate">{post.title}</h3>
                <p className="text-white/40 text-xs mt-1">
                  /blog/{post.slug} · {post.author?.name || "No author"} · Updated {formatDate(post.updatedAt)}
                  {post.datePublished ? ` · Published ${formatDate(post.datePublished)}` : ""}
                </p>
              </div>
              <div className="flex gap-3 items-center flex-wrap">
                {post.status === "published" ? (
                  <>
                    <a
                      href={`${WEBSITE_URL}/blog/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                    <button
                      onClick={() => handleUnpublish(post)}
                      className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Unpublish
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handlePublish(post)}
                    className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Publish
                  </button>
                )}
                <button
                  onClick={() => navigate(`${basePath}/blog/posts/${post._id}`)}
                  className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6 text-sm">
          <button
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-white/60">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogPosts;
