import React from "react";
import { Link } from "react-router-dom";

const EnterpriseCard = ({ data }) => {
  const { name, email, classes = [], image, _id } = data;

  return (
    <Link to={`${_id}`}>
      <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-md p-5 w-full max-w-xs h-fit flex flex-col gap-y-3 transition hover:shadow-lg">
        {/* Top: Avatar and Name */}
        <div className="flex items-center gap-4">
          <img
            src={image}
            alt={name}
            className="w-14 h-14 rounded-full border border-white/30"
          />
          <div>
            <h2 className="text-lg font-semibold">{name}</h2>
            <p className="text-sm text-white/60">{email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-sm text-white/70 pt-2 border-t border-white/10 mt-3">
          <span>Total Classes</span>
          <span>{classes.length}</span>
        </div>
      </div>
    </Link>
  );
};

export default EnterpriseCard;
