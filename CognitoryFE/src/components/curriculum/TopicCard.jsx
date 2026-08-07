import React, { useState } from "react";
import { Link } from "react-router-dom";
import Update from "./Update";
import ToggleSwitch from "../shared/ToogleSwitch";
import { toggleTopicCurriculum } from "../../services/updateAPIs";

const TopicCard = ({ data, onCurriculumToggle }) => {
  const {
    name,
    subject,
    class: cls,
    enterprise,
    subtopics = [],
    createdAt,
    _id,
    isActiveCurriculum = false,
  } = data;

  const [active, setActive] = useState(isActiveCurriculum);
  const [toggling, setToggling] = useState(false);

  const image = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(
    name || _id
  )}`;

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);
    const prev = active;
    setActive(!prev); // optimistic
    try {
      await toggleTopicCurriculum(_id);
      if (onCurriculumToggle) onCurriculumToggle(_id, !prev);
    } catch (err) {
      setActive(prev); // revert on failure
      console.error("Curriculum toggle failed:", err);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute z-10 right-2 top-2">
        <Update id={_id} type={"topic"} />
      </div>
      <Link to={`${_id}`}>
        <div className="bg-white/10 w-80 backdrop-blur-md border border-white/10 rounded-xl text-white p-4 flex flex-col gap-2 shadow-md transition hover:shadow-lg h-fit">
          {/* Avatar + Topic Info */}
          <div className="flex items-center gap-3">
            <img
              src={image}
              alt={name}
              className="w-12 h-12 rounded-lg object-cover border border-white/20"
            />
            <div className="flex-1">
              <h2 className="text-sm font-semibold leading-tight truncate text-wrap">
                {name}
              </h2>
              <p className="text-xs text-gray-300 truncate">
                Subject: {subject?.name || "—"}
              </p>
              <p className="text-xs text-gray-300 truncate">
                Class: {cls?.name || "—"}
              </p>
              <p className="text-xs text-gray-300 truncate">
                Enterprise: {enterprise?.name || "—"}
              </p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="mt-2 text-xs text-gray-400 flex flex-col gap-1">
            <p>
              Subtopics:{" "}
              <span className="text-white font-medium">{subtopics.length}</span>
            </p>
            <p>
              Created:{" "}
              <span className="text-white font-medium">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            </p>
          </div>

          {/* GradeNext Curriculum Toggle */}
          <div
            className="flex items-center justify-between mt-1 pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
            onClick={handleToggle}
          >
            <span className="text-xs font-semibold" style={{ color: active ? "#a5f3fc" : "rgba(255,255,255,0.4)" }}>
              {toggling ? "Syncing…" : active ? "Active in GradeNext" : "Inactive in GradeNext"}
            </span>
            <ToggleSwitch
              value={active}
              onChange={() => {}}
              onColor="bg-cyan-400"
              offColor="bg-gray-600"
              thumbColor="bg-white"
            />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default TopicCard;
