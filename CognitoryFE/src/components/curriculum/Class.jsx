import React from "react";
import { useQueryObject } from "../../services/query";
import { useParams } from "react-router-dom";
import SubjectCard from "./SubjectCard";
import Add from "./Add";
import { Loader2 } from "lucide-react";

const Class = () => {
  const { classId } = useParams();
  const { subjects, subjectsQuery } = useQueryObject({ classId });

  const isLoading = subjectsQuery?.isLoading;
  const isEmpty =
    !isLoading && (!subjects?.subjects || subjects.subjects.length === 0);

  return (
    <div className="p-6 flex flex-col items-center">
      <Add type="subject" />

      <div className="p-6 w-full flex flex-wrap gap-x-6 gap-y-4">
        {isLoading ? (
          <p className="text-white text-sm py-24 w-full flex justify-center items-center">
            <Loader2 size={40} className="animate-spin" />
          </p>
        ) : isEmpty ? (
          <p className="text-white text-lg italic py-24 w-full flex justify-center items-center">
            No subjects available yet.
          </p>
        ) : (
          subjects.subjects.map((sub) => (
            <SubjectCard key={sub._id} data={sub} />
          ))
        )}
      </div>
    </div>
  );
};

export default Class;
