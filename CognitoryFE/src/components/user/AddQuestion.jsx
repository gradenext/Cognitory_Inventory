import React, { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { addQuestionSchema } from "../../validations/question";
import { validateWithZod } from "../../validations/validate";
import { createQuestion, upload } from "../../services/createAPIs";
import { useQueryObject } from "../../services/query";

import Input from "../shared/Input";
import Textarea from "../shared/Textarea";
import Select from "../shared/Select";

import FileUpload from "../shared/FileUpload";
import PreviewModal from "../shared/PreviewModal";

const AddQuestion = () => {
  const { enterpriseId } = useParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    text: "",
    textType: "",
    images: [],
    type: "",
    options: ["", "", "", ""],
    answer: "",
    hint: "",
    explanation: "",
    enterpriseId,
    classId: "",
    subjectId: "",
    topicId: "",
    subtopicId: "",
    levelId: "",
  });

  const memoizedParams = useMemo(
    () => ({
      enterpriseId: form.enterpriseId,
      classId: form.classId,
      subjectId: form.subjectId,
      topicId: form.topicId,
      subtopicId: form.subtopicId,
    }),
    [
      form.enterpriseId,
      form.classId,
      form.subjectId,
      form.topicId,
      form.subtopicId,
    ]
  );

  const {
    classes,
    classesQuery,
    subjects,
    subjectsQuery,
    topics,
    topicsQuery,
    subtopics,
    subtopicsQuery,
    levels,
    levelsQuery,
  } = useQueryObject(memoizedParams);

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
  const subtopicList = useMemo(
    () =>
      subtopics?.subtopics?.map((s) => ({ label: s.name, value: s._id })) || [],
    [subtopics]
  );
  const levelList = useMemo(
    () =>
      levels?.levels?.map((l) => ({
        label: `${l.name} (${l.rank})`,
        value: l._id,
      })) || [],
    [levels]
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError((prev) => ({ ...prev, [name]: null }));
  }, []);

  const handleOptionChange = useCallback((index, value) => {
    setForm((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  }, []);

  const handleImageSelect = useCallback((images) => {
    setForm((prev) => ({ ...prev, images }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({});
    const validationResult = validateWithZod(addQuestionSchema, form);

    if (!validationResult?.success) {
      setError(validationResult.errors);
      toast.error("Check all required fields");
      return;
    }

    setLoading(true);
    try {
      let uploadData = {};
      if (form.images.length > 0) {
        uploadData = await upload(form.images);
      }

      const urls = uploadData.image_urls || [];
      const imageUUID = uploadData.image_id || null;

      const payload = {
        ...form,
        images: urls,
        imageUUID,
      };

      const response = await createQuestion(payload);
      toast.success(response?.message || "Question created");

      setForm((prev) => ({
        ...prev,
        text: "",
        textType: "",
        images: [],
        type: "",
        options: ["", "", "", ""],
        answer: "",
        hint: "",
        explanation: "",
      }));
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto px-6 py-10 w-full">
      <form
        onSubmit={handleSubmit}
        className="p-8 rounded-xl shadow-lg space-y-8"
      >
        {/* Dependent Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <Select
            label="Class"
            selectedOption={form.classId}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                classId: value,
                subjectId: "",
                topicId: "",
                subtopicId: "",
                levelId: "",
              }))
            }
            options={classList}
            loading={classesQuery?.isLoading}
            error={error?.classId}
            disabled={loading}
          />
          <Select
            label="Subject"
            selectedOption={form.subjectId}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                subjectId: value,
                topicId: "",
                subtopicId: "",
                levelId: "",
              }))
            }
            options={subjectList}
            loading={subjectsQuery?.isLoading}
            error={error?.subjectId}
            disabled={!form.classId || loading}
          />
          <Select
            label="Topic"
            selectedOption={form.topicId}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                topicId: value,
                subtopicId: "",
                levelId: "",
              }))
            }
            options={topicList}
            loading={topicsQuery?.isLoading}
            error={error?.topicId}
            disabled={!form.subjectId || loading}
          />
          <Select
            label="Subtopic"
            selectedOption={form.subtopicId}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                subtopicId: value,
                levelId: "",
              }))
            }
            options={subtopicList}
            loading={subtopicsQuery?.isLoading}
            error={error?.subtopicId}
            disabled={!form.topicId || loading}
          />
          <Select
            label="Level"
            selectedOption={form.levelId}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                levelId: value,
              }))
            }
            options={levelList}
            loading={levelsQuery?.isLoading}
            error={error?.levelId}
            disabled={!form.subtopicId || loading}
          />
          <Select
            label="Text Type"
            selectedOption={form.textType}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                textType: value,
              }))
            }
            options={[
              { label: "Text", value: "text" },
              { label: "Markdown", value: "markdown" },
              { label: "Latex", value: "latex" },
            ]}
            error={error?.textType}
            disabled={loading}
          />
          <Select
            label="Type"
            selectedOption={form.type}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                type: value,
              }))
            }
            options={[
              { label: "Input", value: "input" },
              { label: "Multiple", value: "multiple" },
            ]}
            error={error?.type}
            disabled={loading}
          />
        </div>

        {/* File Upload */}
        <Suspense fallback={<div>Loading uploader...</div>}>
          <FileUpload
            onSelect={handleImageSelect}
            value={form.images}
            error={error?.images}
            disabled={loading}
          />
        </Suspense>

        {/* Content Inputs */}
        <Textarea
          label="Question"
          name="text"
          value={form.text}
          onChange={handleChange}
          error={error?.text}
          disabled={loading}
          placeholder="Enter question"
        />

        {form.type === "multiple" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {form.options.map((opt, idx) => (
              <Input
                key={idx}
                label={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                error={error?.options}
                disabled={loading}
              />
            ))}
          </div>
        )}

        <Textarea
          label="Answer"
          name="answer"
          value={form.answer}
          onChange={handleChange}
          error={error?.answer}
          rows={1}
          disabled={loading}
          placeholder="Enter answer"
        />
        <Textarea
          label="Hint"
          name="hint"
          value={form.hint}
          onChange={handleChange}
          error={error?.hint}
          disabled={loading}
          placeholder="Enter hint"
        />
        <Textarea
          label="Explanation"
          name="explanation"
          value={form.explanation}
          onChange={handleChange}
          error={error?.explanation}
          disabled={loading}
          placeholder="Enter explanation"
        />

        <PreviewModal
          question={form?.text} // use raw text here
          options={form?.options}
          answer={form?.answer}
          hint={form?.hint}
          explanation={form?.explanation}
          images={form?.images}
        />

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full cursor-pointer bg-black border hover:bg-white hover:text-black text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "Add Question"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuestion;
