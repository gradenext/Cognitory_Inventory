import React from "react";
import { useParams } from "react-router-dom";
import { useQueryObject } from "../../services/query";
import Add from "./Add";
import LevelCard from "./LevelCard";
import { Loader2 } from "lucide-react";

const Subtopic = () => {
  const { subtopicId } = useParams();
  const { levels, levelsQuery } = useQueryObject({ subtopicId });

  const isLoading = levelsQuery?.isLoading;
  const isEmpty = !isLoading && (!levels?.levels || levels.levels.length === 0);

  return (
    <div className="p-6 flex flex-col items-center">
      <Add type="level" />

      <div className="p-6 w-full flex flex-wrap gap-x-6 gap-y-4">
        {isLoading ? (
          <p className="text-white text-sm py-24 w-full flex justify-center items-center">
            <Loader2 size={40} className="animate-spin" />
          </p>
        ) : isEmpty ? (
          <p className="text-white text-lg italic py-24 w-full flex justify-center items-center">
            No levels available yet.
          </p>
        ) : (
          levels.levels.map((lvl) => <LevelCard key={lvl._id} data={lvl} />)
        )}
      </div>
    </div>
  );
};

export default Subtopic;
