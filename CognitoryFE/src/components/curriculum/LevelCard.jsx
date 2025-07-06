import React from "react";

const LevelCard = ({ data }) => {
  const {
    name,
    rank,
    subtopic,
    topic,
    subject,
    class: cls,
    enterprise,
    createdAt,
    _id,
  } = data;

  const avatar = `https://api.dicebear.com/9.x/icons/svg?seed=${rank}`;

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white p-4 flex flex-col gap-2 shadow-md transition hover:shadow-lg h-fit">
      {/* Avatar + Level Info */}
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={`Level ${name}`}
          className="w-12 h-12 rounded-lg object-cover border border-white/20"
        />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold truncate">{name}</h2>
            <div className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded-full font-semibold">
              Rank: {rank}
            </div>
          </div>

          <p className="text-xs text-gray-300 truncate">
            Subtopic: {subtopic?.name || "—"}
          </p>
          <p className="text-xs text-gray-300 truncate">
            Subtopic: {topic?.name || "—"}
          </p>
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
          Created:{" "}
          <span className="text-white font-medium">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LevelCard;
