import { Loader2 } from "lucide-react";
import { useQueryObject } from "../../services/query";
import Pagination from "../shared/Pagination";
import { useParams, useSearchParams } from "react-router-dom";
import QuestionCard from "../shared/QuestionCard";
import { useEffect, useState } from "react";
import ToggleSwitch from "../shared/ToogleSwitch";

const UserQuestion = () => {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [imageOnly, setImageOnly] = useState(false);
  const { questions, questionsQuery, setPage } = useQueryObject({
    userId,
    image: imageOnly,
    pageNumber: searchParams.get("page"),
  });
  const isLoading = questionsQuery?.isLoading;
  const total = questions?.data?.total ?? "-";
  const list = questions?.data?.questions || [];

  useEffect(() => {
    const pageNumber = searchParams.get("page");
    if (!pageNumber) {
      setSearchParams({ page: 1 });
    }
    setPage(pageNumber);
  }, [searchParams]);

  return (
    <div className="w-full px-6 py-8 space-y-6">
      {/* Heading Always Shown */}
      <div className="flex w-full flex-col items-center justify-between border-b border-white/20 pb-4">
        <div className="flex items-center justify-between pb-4 w-full">
          <h2 className="text-2xl font-semibold text-white">
            Created Questions
          </h2>
          <span className="text-sm text-white/60">Total: {total}</span>
        </div>

        <Pagination
          data={questions?.data}
          onPageChange={(newPage) => {
            setPage(newPage);
            setSearchParams({ page: newPage });
          }}
        />

        <div className="w-full flex justify-between items-center my-4">
          <div className="text-white font-bold ">Image Only</div>
          <ToggleSwitch value={imageOnly} onChange={setImageOnly} />
        </div>
      </div>

      {/* Conditional Rendering */}
      {isLoading ? (
        <p className="text-white text-sm py-24 w-full flex justify-center items-center">
          <Loader2 size={40} className="animate-spin" />
        </p>
      ) : list.length === 0 ? (
        <p className="text-white text-lg italic py-24 w-full flex justify-center items-center">
          No question created yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {list.map((question) => (
            <QuestionCard
              key={question._id}
              question={question}
              shouldDelete={true}
              shouldReview={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserQuestion;
