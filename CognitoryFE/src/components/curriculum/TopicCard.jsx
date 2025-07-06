import React from "react";
import { Link } from "react-router-dom";

const TopicCard = ({ data }) => {
  const {
    name,
    subject,
    class: cls,
    enterprise,
    subtopics = [],
    createdAt,
    _id,
  } = data;

  const image = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(
    name || _id
  )}`;

  return (
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
      </div>
    </Link>
  );
};

export default TopicCard;
