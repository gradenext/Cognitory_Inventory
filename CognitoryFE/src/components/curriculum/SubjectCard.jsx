import React from "react";
import { Link } from "react-router-dom";
import Update from "./Update";

const SubjectCard = ({ data }) => {
  const { name, class: cls, enterprise, topics = [], createdAt, _id } = data;

  const image = `https://api.dicebear.com/9.x/icons/svg?seed=${encodeURIComponent(
    name || _id
  )}`;

  return (
    <div className="relative">
      <div className="absolute z-10 right-2 top-2">
        <Update id={_id} type={"subject"} />
      </div>
      <Link to={`${_id}`}>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white p-4 flex flex-col gap-2 shadow-md transition hover:shadow-lg h-fit">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <img
              src={image}
              alt={name}
              className="w-12 h-12 rounded-lg object-cover border border-white/20"
            />
            <div className="flex-1">
              <h2 className="text-base font-semibold truncate">{name}</h2>
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
              Topics:{" "}
              <span className="text-white font-medium">{topics.length}</span>
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
    </div>
  );
};

export default SubjectCard;
