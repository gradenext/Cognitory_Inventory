import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const metricKeys = [
  { label: "Total", key: "count" },
  { label: "Week", key: "thisWeek" },
  { label: "Month", key: "thisMonth" },
  { label: "Approved", key: "approved" },
  { label: "Approved/Week", key: "approvedThisWeek" },
  { label: "Approved/Month", key: "approvedThisMonth" },
];

const StickyMetricHeader = () => (
  <div className="sticky top-0 z-10 px-2 py-2 bg-white backdrop-blur border-b border-white/10 flex justify-between items-center min-w-[800px]">
    <span className="truncate " title="Entity">
      Entity
    </span>
    <div className="grid grid-cols-[repeat(6,minmax(100px,120px))] text-black text-[10px] sm:text-xs font-semibold ">
      {metricKeys.map(({ label }) => (
        <span key={label} className="text-center truncate pr-2" title={label}>
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
        className="flex justify-between px-2 py-2 text-white hover:bg-white/5 transition cursor-pointer min-w-[800px]"
        onClick={() => children && setOpen(!open)}
      >
        {/* Title column with indentation */}
        <div className="flex items-center text-xs sm:text-sm font-medium">
          <div
            style={{ paddingLeft: `${level * 1.25}rem` }}
            className="flex items-center gap-1 truncate"
          >
            {children &&
              (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            <span className="truncate" title={title}>
              {title}
            </span>
          </div>
        </div>

        {/* Metrics aligned with header */}
        <div className="grid grid-cols-[repeat(6,minmax(100px,120px))]">
          {metricKeys.map(({ key }) => (
            <div
              key={key}
              className="text-center text-white  text-[10px] sm:text-xs font-semibold truncate pr-2"
              title={metrics?.[key] ?? 0}
            >
              {metrics?.[key] ?? 0}
            </div>
          ))}
        </div>
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

const Metric = ({ data }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-white text-lg sm:text-xl font-semibold">
        Interaction Breakdown
      </h3>
      <div className="rounded-lg border border-white/10 bg-white/5 overflow-x-auto max-h-[75vh]">
        <div className="min-w-[800px]">
          <StickyMetricHeader />
          <div className="divide-y divide-white/10">
            {renderBreakdownTree(data)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metric;
