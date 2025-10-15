import { Loader2 } from "lucide-react";
import { useQueryObject } from "../../services/query";
import QuestionCard from "../shared/QuestionCard";
import Pagination from "../shared/Pagination";
import ToggleSwitch from "../shared/ToogleSwitch";
import { useMemo, useState } from "react";
import Select from "../shared/Select";

const Question = () => {
  const [imageOnly, setImageOnly] = useState(false);
  const [classId, setClassId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [topicId, setTopicId] = useState(null);

  const memoizedParams = useMemo(
    () => ({
      image: imageOnly,
      subjectId,
      topicId,
      classId,
      enterpriseId: import.meta.env.VITE_ENTERPRISE_ID,
    }),
    [imageOnly, subjectId, topicId, classId]
  );
  const {
    questions,
    questionsQuery,
    setPage,
    classes,
    classesQuery,
    subjects,
    subjectsQuery,
    topics,
    topicsQuery,
  } = useQueryObject(memoizedParams);
  const isLoading = questionsQuery?.isLoading;
  const total = questions?.data?.total ?? "-";
  const list = questions?.data?.questions || [];
  const classList = useMemo(
    () => classes?.classes?.map((c) => ({ label: c.name, value: c._id })) || [],
    [classes]
  );
  const subjectList = useMemo(
    () =>
      subjects?.subjects?.map((s) => ({ label: s.name, value: s._id })) || [],
    [subjects]
  );
  const topicList = useMemo(
    () => topics?.topics?.map((t) => ({ label: t.name, value: t._id })) || [],
    [topics]
  );

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
          onPageChange={(newPage) => setPage(newPage)}
        />

        <div className="w-full flex justify-between items-center my-4">
          <div className="text-white font-bold ">Image Only</div>
          <ToggleSwitch value={imageOnly} onChange={setImageOnly} />
        </div>

        <div className="grid grid-cols-3 gap-x-2 w-full">
          <Select
            label="Class"
            selectedOption={classId}
            onSelect={(value) => {
              setClassId(value);
              setSubjectId(null);
              setTopicId(null);
            }}
            options={classList}
            loading={classesQuery?.isLoading}
            disabled={isLoading}
          />
          <Select
            label="Subject"
            selectedOption={subjectId}
            onSelect={(value) => {
              setSubjectId(value);
              setTopicId(null);
            }}
            options={subjectList}
            loading={subjectsQuery?.isLoading}
            disabled={!classId || isLoading}
          />
          <Select
            label="Topic"
            selectedOption={topicId}
            onSelect={(value) => setTopicId(value)}
            options={topicList}
            loading={topicsQuery?.isLoading}
            disabled={!subjectId || isLoading}
          />
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
            <QuestionCard key={question._id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Question;
