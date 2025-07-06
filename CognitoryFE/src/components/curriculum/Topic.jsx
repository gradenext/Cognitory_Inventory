import React from "react";
import { useParams } from "react-router-dom";
import { useQueryObject } from "../../services/query";
import Add from "./Add";
import SubtopicCard from "./SubtopicCard";
import { Loader2 } from "lucide-react";

const Topic = () => {
  const { topicId } = useParams();
  const { subtopics, subtopicsQuery } = useQueryObject({ topicId });

  const isLoading = subtopicsQuery?.isLoading;
  const isEmpty =
    !isLoading && (!subtopics?.subtopics || subtopics.subtopics.length === 0);

  return (
    <div className="p-6 flex flex-col items-center">
      <Add type="subtopic" />

      <div className="p-6 w-full flex flex-wrap gap-x-6 gap-y-4">
        {isLoading ? (
          <p className="text-white text-sm py-24 w-full  flex justify-center items-center">
            <Loader2 size={40} className="animate-spin" />
          </p>
        ) : isEmpty ? (
          <p className="text-white text-lg italic py-24 w-full flex justify-center items-center">
            No subtopics available yet.
          </p>
        ) : (
          subtopics?.subtopics.map((sub) => (
            <SubtopicCard key={sub._id} data={sub} />
          ))
        )}
      </div>
    </div>
  );
};

export default Topic;
