import React, { useState } from "react";
import { addQuestionSchema } from "../validations/question";
import { validateWithZod } from "../validations/validate";
import Input from "../components/shared/Input";
import FileUpload from "../components/shared/FileUpload";
import Textarea from "../components/shared/Textarea";

const AddQuestion = () => {
  const [form, setForm] = useState({
    text: "",
    textType: "text",
    type: "input",
    option: ["", "", "", ""],
    answer: "",
    hint: "",
    explanation: "",
    creatorId: "",
    enterpriseId: "",
    classId: "",
    subjectId: "",
    topicId: "",
    subtopicId: "",
    levelId: "",
  });

  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...form.option];
    newOptions[idx] = value;
    setForm((prev) => ({ ...prev, option: newOptions }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationResult = validateWithZod(addQuestionSchema, form);
    console.log(validationResult.errors);
    setError(null);
    console.log(form);
    // Submit logic here
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-2">
        Add New Question
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg space-y-8"
      >
        <div className="grid grid-cols-2 gap-2 ">
          <Input
            label="Enterprise ID"
            name="enterpriseId"
            value={form.enterpriseId}
            onChange={handleChange}
          />
          <Input
            label="Class ID"
            name="classId"
            value={form.classId}
            onChange={handleChange}
          />
          <Input
            label="Subject ID"
            name="subjectId"
            value={form.subjectId}
            onChange={handleChange}
          />
          <Input
            label="Topic ID"
            name="topicId"
            value={form.topicId}
            onChange={handleChange}
          />
          <Input
            label="Subtopic ID"
            name="subtopicId"
            value={form.subtopicId}
            onChange={handleChange}
          />
          <Input
            label="Level ID"
            name="levelId"
            value={form.levelId}
            onChange={handleChange}
          />
          <Input
            label="Text Type"
            name="textType"
            value={form.textType}
            onChange={handleChange}
          />
          <Input
            label="Type"
            name="type"
            value={form.type}
            onChange={handleChange}
          />
        </div>
        {/* File Upload */}
        <div>
          <FileUpload
            fileType="images"
            multiple
            maxFiles={5}
            files={files}
            setFiles={setFiles}
          />
        </div>

        {/* Input Fields */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {form?.type === "multiple" &&
            form.option.map((opt, idx) => (
              <Input
                key={idx}
                label={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
              />
            ))}
        </div>
        <Textarea
          label={"Question"}
          name={"text"}
          value={form.text}
          placeholder={"Enter your question text"}
          onChange={handleChange}
        />
        <Textarea
          label="Answer"
          name="answer"
          value={form.answer}
          onChange={handleChange}
          rows={1}
        />
        <Textarea
          label="Hint"
          name="hint"
          value={form.hint}
          onChange={handleChange}
        />
        <Textarea
          label="Explanation"
          name="explanation"
          value={form.explanation}
          onChange={handleChange}
        />

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
          >
            Add Question
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuestion;
