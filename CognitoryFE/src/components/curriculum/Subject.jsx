import React from "react";
import { useQueryObject } from "../../services/query";
import TopicCard from "./TopicCard";
import { useParams } from "react-router-dom";
import Add from "./Add";
import { Loader2 } from "lucide-react";

const Subject = () => {
  const { subjectId } = useParams();
  const { topics, topicsQuery } = useQueryObject({ subjectId });

  const isLoading = topicsQuery?.isLoading;
  const isEmpty = !isLoading && (!topics?.topics || topics.topics.length === 0);

  return (
    <div className="p-6 flex flex-col items-center">
      <Add type="topic" />

      <div className="p-6 w-full flex flex-wrap gap-x-6 gap-y-4">
        {isLoading ? (
          <p className="text-white text-sm py-24 w-full flex justify-center items-center">
            <Loader2 size={40} className="animate-spin" />
          </p>
        ) : isEmpty ? (
          <p className="text-white text-lg italic py-24 w-full flex justify-center items-center">
            No topics available yet.
          </p>
        ) : (
          topics.topics.map((sub) => <TopicCard key={sub._id} data={sub} />)
        )}
      </div>
    </div>
  );
};

export default Subject;
