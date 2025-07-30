import React from "react";
import { useQueryObject } from "../../services/query";
import QuestionCard from "../shared/QuestionCard";
import { Loader2 } from "lucide-react";
import Pagination from "../shared/Pagination";

const ReviewedQuestion = () => {
  const { questions, questionsQuery, setPage } = useQueryObject({
    reviewed: true,
  });
  const isLoading = questionsQuery?.isLoading;
  const total = questions?.data?.total ?? "-";
  const list = questions?.data?.questions || [];

  return (
    <div className="w-full px-6 py-8 space-y-6">
      {/* Heading Always Shown */}
      <div className="flex w-full flex-col items-center justify-between border-b border-white/20 pb-4">
        <div className="flex items-center justify-between pb-4 w-full">
          <h2 className="text-2xl font-semibold text-white">
            Reviewed Questions
          </h2>
          <span className="text-sm text-white/60">Total: {total}</span>
        </div>

        <Pagination
          data={questions?.data}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Conditional Rendering */}
      {isLoading ? (
        <p className="text-white text-sm py-24 w-full flex justify-center items-center">
          <Loader2 size={40} className="animate-spin" />
        </p>
      ) : list.length === 0 ? (
        <p className="text-white text-lg italic py-24 w-full flex justify-center items-center">
          No question reviewed yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {list.map((question) => (
            <QuestionCard key={question._id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewedQuestion;
