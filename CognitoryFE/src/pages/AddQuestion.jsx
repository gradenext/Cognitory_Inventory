import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { addQuestionSchema } from "../validations/question";
import { validateWithZod } from "../validations/validate";
import Input from "../components/shared/Input";
import FileUpload from "../components/shared/FileUpload";
import Textarea from "../components/shared/Textarea";
import Select from "../components/shared/Select";
import { useQueryObject } from "../services/query";
import toast from "react-hot-toast";
import { createQuestion, upload } from "../services/api";
import { v4 as uuidv4 } from "uuid";

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

  const { classes, subjects, topics, subtopics, levels } = useQueryObject(
    form?.enterpriseId,
    form?.classId,
    form?.subjectId,
    form?.topicId,
    form?.subtopicId
  );

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...form.options];
    newOptions[idx] = value;
    setForm((prev) => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const validationResult = validateWithZod(addQuestionSchema, form);
      if (!validationResult?.success) {
        console.log(validationResult.errors);
        setError(validationResult.errors);
        toast.error("Check all required fields");
        return;
      }
      setLoading(true);
      let uploadData = {};
      if (form?.images?.length > 0) {
        uploadData = await upload(form?.images);
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

      toast.success(response.message);

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
      toast.error(error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" mx-auto px-6 py-10 bg-black min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-8 border-b pb-2">
        Add New Question
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-black p-8 rounded-xl shadow-lg space-y-8"
      >
        <div className="grid grid-cols-3 gap-2 ">
          <Select
            label="Class"
            placeholder="Select Class "
            selectedOption={form.classId}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                classId: value,
                subjectId: null,
                topicId: null,
                subtopicId: null,
                levelId: null,
              }))
            }
            disabled={!(classes?.data?.length > 0) || loading}
            loading={classes?.isLoading}
            options={classes?.isLoading ? [] : classes?.data}
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
            disabled={!form?.classId || subjects?.isLoading || loading}
            loading={subjects?.isLoading}
            options={
              !form?.classId || subjects?.isLoading ? [] : subjects?.data
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
            disabled={!form?.subjectId || topics?.isLoading || loading}
            loading={topics?.isLoading}
            options={!form?.subjectId || topics?.isLoading ? [] : topics?.data}
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
            disabled={!form?.topicId || subtopics?.isLoading || loading}
            loading={subtopics?.isLoading}
            options={
              !form?.topicId || subtopics?.isLoading ? [] : subtopics?.data
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
            disabled={!form?.subtopicId || levels?.isLoading || loading}
            loading={levels?.isLoading}
            options={!form?.subtopicId || levels?.isLoading ? [] : levels?.data}
            error={error?.levelId}
          />

          {/* Content ttype */}

          <Select
            label="Text Type"
            placeholder="Select Text Type "
            selectedOption={form.textType}
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                textType: value,
              }))
            }
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
            onSelect={(value) =>
              setForm((prev) => ({
                ...prev,
                type: value,
              }))
            }
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
        <div>
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
        </div>

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
            Add Question
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuestion;
