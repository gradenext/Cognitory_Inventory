import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { getUserProfile } from "../../services/getAPIs";

const metricKeys = [
  { label: "Total", key: "count" },
  { label: "Week", key: "thisWeek" },
  { label: "Month", key: "thisMonth" },
  { label: "Approved", key: "approved" },
  { label: "Approved/Week", key: "approvedThisWeek" },
  { label: "Approved/Month", key: "approvedThisMonth" },
];

const StickyMetricHeader = () => (
  <div className="sticky top-0 z-10 bg-white/10 backdrop-blur border-b border-white/10">
    <div className="grid grid-cols-[minmax(250px,1fr)_repeat(6,80px)] px-2 py-2 text-white/60 text-[10px] sm:text-xs font-semibold">
      <span className="truncate">Entity</span>
      {metricKeys.map(({ label }) => (
        <span key={label} className="text-right truncate">
          {label}
        </span>
      ))}
    </div>
  </div>
);

const TreeRow = ({ title, metrics, level = 0, children }) => {
  const [open, setOpen] = useState(level < 2);

  return (
    <>
      <div
        className="grid grid-cols-[minmax(250px,1fr)_repeat(6,80px)] px-2 py-2 text-white hover:bg-white/5 transition cursor-pointer"
        onClick={() => children && setOpen(!open)}
      >
        {/* Title column with indentation */}
        <div className="flex items-center text-sm sm:text-base font-medium">
          <div
            style={{ paddingLeft: `${level * 1.25}rem` }}
            className="flex items-center gap-1 truncate"
          >
            {children &&
              (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
            <span>{title}</span>
          </div>
        </div>

        {/* Metrics aligned with header */}
        {metricKeys.map(({ key }) => (
          <div
            key={key}
            className="text-right text-white text-[10px] sm:text-xs font-semibold truncate"
          >
            {metrics?.[key] ?? 0}
          </div>
        ))}
      </div>

      {/* Child rows */}
      {open && children && (
        <div className="ml-[1.25rem] border-l border-white/10 pl-4 space-y-1">
          {children}
        </div>
      )}
    </>
  );
};

const renderBreakdownTree = (data, level = 0) =>
  data.map((enterprise) => (
    <TreeRow
      key={enterprise._id}
      title={enterprise.name}
      metrics={enterprise}
      level={level}
    >
      {enterprise.classes?.map((cls) => (
        <TreeRow
          key={cls._id}
          title={`Class ${cls.name}`}
          metrics={cls}
          level={level + 1}
        >
          {cls.subjects?.map((subject) => (
            <TreeRow
              key={subject._id}
              title={subject.name}
              metrics={subject}
              level={level + 2}
            >
              {subject.topics?.map((topic) => (
                <TreeRow
                  key={topic._id}
                  title={topic.name}
                  metrics={topic}
                  level={level + 3}
                >
                  {topic.subtopics?.map((subtopic) => (
                    <TreeRow
                      key={subtopic._id}
                      title={subtopic.name}
                      metrics={subtopic}
                      level={level + 4}
                    >
                      {subtopic.levels?.map((levelNode) => (
                        <TreeRow
                          key={levelNode._id}
                          title={levelNode.name}
                          metrics={levelNode}
                          level={level + 5}
                        />
                      ))}
                    </TreeRow>
                  ))}
                </TreeRow>
              ))}
            </TreeRow>
          ))}
        </TreeRow>
      ))}
    </TreeRow>
  ));

const CountBadge = ({ label, count }) => (
  <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-lg text-white text-sm font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between shadow">
    <span className="text-white/80">{label}</span>
    <span className="font-bold text-lg">{count}</span>
  </div>
);

const UserProfilePage = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [breakdown, setBreakdown] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfile();
        setUser(res.user);
        setStats(res.stats);
        setBreakdown(res.breakdown);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  if (!user || !stats) {
    return (
      <div className="text-white px-6 py-10">
        <p className="text-sm py-24 w-full flex justify-center items-center">
          <Loader2 size={40} className="animate-spin" />
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Profile Info */}
      <div className="bg-white/5 border border-white/20 rounded-xl shadow">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <img
              src={user.image}
              alt="User"
              className="w-16 h-16 rounded-full border border-white/20 object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-white/70 text-sm break-all">{user.email}</p>
            </div>
          </div>
          <div className="h-px bg-white/20 my-2" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <CountBadge label="Questions" count={stats.questionCount} />
            <CountBadge label="Reviewed" count={stats.reviewedCount} />
            <CountBadge label="Approved" count={stats.approvedCount} />
            <CountBadge label="Unapproved" count={stats.unapprovedCount} />
            <CountBadge label="Avg Rating" count={stats.averageRating ?? "-"} />
          </div>
        </div>
      </div>

      {/* Interaction Breakdown */}
      <div className="space-y-4">
        <h3 className="text-white text-xl font-semibold">
          Interaction Breakdown
        </h3>
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-x-auto max-h-[75vh]">
          <div className="min-w-[700px]">
            <StickyMetricHeader />
            <div className="divide-y divide-white/10">
              {renderBreakdownTree(breakdown)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
