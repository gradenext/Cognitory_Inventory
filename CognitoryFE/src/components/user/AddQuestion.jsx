import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { addQuestionSchema } from "../../validations/question";
import { validateWithZod } from "../../validations/validate";
import Input from "../shared/Input";
import FileUpload from "../shared/FileUpload";
import Textarea from "../shared/Textarea";
import Select from "../shared/Select";
import { useQueryObject } from "../../services/query";
import toast from "react-hot-toast";
import { createQuestion, upload } from "../../services/createAPIs";
import { Loader2 } from "lucide-react";

const AddQuestion = () => {
  const { enterpriseId } = useParams();

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
  } = useQueryObject({
    enterpriseId: form?.enterpriseId,
    classId: form?.classId,
    subjectId: form?.subjectId,
    topicId: form?.topicId,
    subtopicId: form?.subtopicId,
  });

  const classList =
    classes?.classes?.map((cls) => ({
      label: cls?.name,
      value: cls?._id,
    })) || [];

  const subjectList =
    subjects?.subjects?.map((subj) => ({
      label: subj?.name,
      value: subj?._id,
    })) || [];

  const topicList =
    topics?.topics?.map((topic) => ({
      label: topic?.name,
      value: topic?._id,
    })) || [];

  const subtopicList =
    subtopics?.subtopics?.map((sub) => ({
      label: sub?.name,
      value: sub?._id,
    })) || [];

  const levelList =
    levels?.levels?.map((level) => ({
      label: level?.name,
      value: level?._id,
    })) || [];

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError((prev) => ({ ...prev, [name]: null }));
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...form.options];
    newOptions[idx] = value;
    setForm((prev) => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({});

    try {
      const validationResult = validateWithZod(addQuestionSchema, form);
      if (!validationResult?.success) {
        setError(validationResult.errors);
        toast.error("Check all required fields");
        return;
      }
      setLoading(true);
      let uploadData = {};
      if (form?.images?.length > 0) {
        try {
          uploadData = await upload(form?.images);
        } catch (error) {
          throw new Error("Image upload failed, please try again");
        }
      }

      const urls = uploadData?.urls;
      const imageUUID = uploadData?.uuid;
      const response = await createQuestion({
        text: form.text,
        images: urls,
        imageUUID,
        textType: form?.textType,
        type: form?.type,
        options: form?.options,
        answer: form?.answer,
        hint: form?.hint,
        explanation: form?.explanation,
        enterpriseId,
        classId: form?.classId,
        subjectId: form?.subjectId,
        topicId: form?.topicId,
        subtopicId: form?.subtopicId,
        levelId: form?.levelId,
      });

      toast.success(response?.message);

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
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" mx-auto px-6 py-10 w-full">
      <form
        onSubmit={handleSubmit}
        className="p-8 rounded-xl shadow-lg space-y-8"
      >
        <div className="grid grid-cols-3 gap-2 ">
          <Select
            label="Class"
            placeholder="Select Class "
            selectedOption={form.classId}
            onSelect={(value) => {
              setForm((prev) => ({
                ...prev,
                classId: value,
                subjectId: null,
                topicId: null,
                subtopicId: null,
                levelId: null,
              }));
            }}
            disabled={!(classList?.length > 0) || loading}
            loading={classesQuery?.isLoading}
            options={classesQuery?.isLoading ? [] : classList}
            error={error?.classId}
          />
          <Select
            label="Subject"
            placeholder="Select Subject "
            selectedOption={form.subjectId}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                subjectId: value,
                topicId: null,
                subtopicId: null,
                levelId: null,
              }))
            }
            disabled={!form?.classId || subjectsQuery?.isLoading || loading}
            loading={subjectsQuery?.isLoading}
            options={
              !form?.classId || subjectsQuery?.isLoading ? [] : subjectList
            }
            error={error?.subjectId}
          />
          <Select
            label="Topic"
            placeholder="Select Topic "
            selectedOption={form.topicId}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                topicId: value,
                subtopicId: null,
                levelId: null,
              }))
            }
            disabled={!form?.subjectId || topicsQuery?.isLoading || loading}
            loading={topicsQuery?.isLoading}
            options={
              !form?.subjectId || topicsQuery?.isLoading ? [] : topicList
            }
            error={error?.topicId}
          />
          <Select
            label="Subtopic"
            placeholder="Select SubTopic "
            selectedOption={form.subtopicId}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                subtopicId: value,
                levelId: null,
              }))
            }
            disabled={!form?.topicId || subtopicsQuery?.isLoading || loading}
            loading={subtopicsQuery?.isLoading}
            options={
              !form?.topicId || subtopicsQuery?.isLoading ? [] : subtopicList
            }
            error={error?.subtopicId}
          />
          <Select
            label="Level"
            placeholder="Select Level "
            selectedOption={form.levelId}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                levelId: value,
              }))
            }
            disabled={!form?.subtopicId || levelsQuery?.isLoading || loading}
            loading={levelsQuery?.isLoading}
            options={
              !form?.subtopicId || levelsQuery?.isLoading ? [] : levelList
            }
            error={error?.levelId}
          />

          {/* Content ttype */}

          <Select
            label="Text Type"
            placeholder="Select Text Type "
            selectedOption={form.textType}
            onSelect={(value) => {
              setForm((prev) => ({
                ...prev,
                textType: value,
              }));

              setError((prev) => ({ ...prev, textType: null }));
            }}
            options={[
              {
                label: "Text",
                value: "text",
              },
              {
                label: "Markdown",
                value: "markdown",
              },
              {
                label: "Latex",
                value: "latex",
              },
            ]}
            error={error?.textType}
            disabled={loading}
          />

          {/* Question type */}
          <Select
            label="Type"
            placeholder="Select Type "
            selectedOption={form.type}
            onSelect={(value) => {
              setForm((prev) => ({
                ...prev,
                type: value,
              }));
              setError((prev) => ({ ...prev, type: null }));
            }}
            options={[
              {
                label: "Input",
                value: "input",
              },
              {
                label: "Multiple",
                value: "multiple",
              },
            ]}
            error={error?.type}
            disabled={loading}
          />
        </div>
        {/* File Upload */}
        {/* <div>
          <FileUpload
            onSelect={(imageArray) =>
              setForm((prev) => ({
                ...prev,
                images: imageArray,
              }))
            }
            error={error?.images}
            disabled={loading}
          />
        </div> */}

        {/* Input Fields */}

        <Textarea
          label={"Question"}
          name={"text"}
          value={form.text}
          placeholder={"Enter your question text"}
          onChange={handleChange}
          error={error?.text}
          disabled={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {form?.type === "multiple" &&
            form.options.map((opt, idx) => (
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
        <Textarea
          label="Answer"
          name="answer"
          value={form.answer}
          onChange={handleChange}
          placeholder={"Enter  answer"}
          rows={1}
          error={error?.answer}
          disabled={loading}
        />
        <Textarea
          label="Hint"
          name="hint"
          value={form.hint}
          onChange={handleChange}
          placeholder={"Enter hint"}
          error={error?.hint}
          disabled={loading}
        />
        <Textarea
          label="Explanation"
          name="explanation"
          value={form.explanation}
          onChange={handleChange}
          placeholder={"Enter explanation"}
          error={error?.explanation}
          disabled={loading}
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
