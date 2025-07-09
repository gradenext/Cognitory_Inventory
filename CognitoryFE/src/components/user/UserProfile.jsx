import React, { useEffect, useState } from "react";
import { Star, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { getUserProfile } from "../../services/getAPIs";

const CountBadge = ({ label, count }) => (
  <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-lg text-white text-sm font-medium flex items-center justify-between shadow">
    <span>{label}</span>
    <span className="font-bold ml-2">{count}</span>
  </div>
);

const Collapsible = ({ title, count, children, level = 0 }) => {
  const [open, setOpen] = useState(level < 2);

  const fontSizes = [
    "text-xl",
    "text-lg",
    "text-base",
    "text-sm",
    "text-sm",
    "text-sm",
  ];
  const fontSize = fontSizes[level] || "text-sm";
  const paddingLeft = `pl-${level * 4}`;

  return (
    <div className={`${paddingLeft} space-y-2`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between text-white/90 font-medium ${fontSize} hover:bg-white/5 px-2 py-1 rounded cursor-pointer`}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>{title}</span>
        </div>
        <span className="ml-4 bg-white/10 px-2 py-0.5 rounded text-white font-bold text-xs shadow-sm">
          {count}
        </span>
      </button>
      {open && (
        <div className="ml-4 border-l border-white/20 pl-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

const LevelNode = ({ level }) => (
  <div className="pl-6 text-white/80 text-sm flex justify-between items-center cursor-pointer hover:bg-white/5 px-2 py-1 rounded">
    <span>{level.name}</span>
    <span className="bg-white/10 px-2 py-0.5 rounded text-white font-semibold text-xs shadow-sm">
      {level.count}
    </span>
  </div>
);

const SubtopicNode = ({ subtopic }) => (
  <Collapsible title={subtopic.name} count={subtopic.count} level={5}>
    {subtopic.levels.map((lvl) => (
      <LevelNode key={lvl._id} level={lvl} />
    ))}
  </Collapsible>
);

const TopicNode = ({ topic }) => (
  <Collapsible title={topic.name} count={topic.count} level={4}>
    {topic.subtopics.map((subt) => (
      <SubtopicNode key={subt._id} subtopic={subt} />
    ))}
  </Collapsible>
);

const SubjectNode = ({ subject }) => (
  <Collapsible title={subject.name} count={subject.count} level={3}>
    {subject.topics.map((topic) => (
      <TopicNode key={topic._id} topic={topic} />
    ))}
  </Collapsible>
);

const ClassNode = ({ classItem }) => (
  <Collapsible
    title={`Class ${classItem.name}`}
    count={classItem.count}
    level={2}
  >
    {classItem.subjects.map((subj) => (
      <SubjectNode key={subj._id} subject={subj} />
    ))}
  </Collapsible>
);

const EnterpriseNode = ({ enterprise }) => (
  <Collapsible title={enterprise.name} count={enterprise.count} level={1}>
    {enterprise.classes.map((cls) => (
      <ClassNode key={cls._id} classItem={cls} />
    ))}
  </Collapsible>
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

  if (!user || !stats)
    return (
      <div className="text-white px-6 py-10">
        <p className="text-white text-sm py-24 w-full flex justify-center items-center">
          <Loader2 size={40} className="animate-spin" />
        </p>
      </div>
    );

  return (
    <div className=" mx-auto px-4 py-10 space-y-10">
      <div className="bg-white/5 border border-white/20 rounded-xl shadow">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={user.image}
              alt="User"
              className="w-16 h-16 rounded-full border border-white/20"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-white/70">{user.email}</p>
            </div>
          </div>
          <div className="h-px bg-white/20 my-2" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <CountBadge label="Questions" count={stats.questionCount} />
            <CountBadge label="Reviewed" count={stats.reviewedCount} />
            <CountBadge label="Approved" count={stats.approvedCount} />
            <CountBadge label="Unapproved" count={stats.unapprovedCount} />
            <CountBadge label="Avg Rating" count={stats.averageRating ?? "-"} />
            <CountBadge
              label={
                <>
                  <Star className="w-4 h-4 inline mr-1" /> Ratings
                </>
              }
              count={stats.ratingCount}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-white text-xl font-semibold">
          Interaction Breakdown
        </h3>
        <div className="space-y-4">
          {breakdown.map((enterprise) => (
            <EnterpriseNode key={enterprise._id} enterprise={enterprise} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
