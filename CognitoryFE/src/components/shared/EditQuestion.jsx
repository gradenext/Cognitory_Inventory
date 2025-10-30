import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Loader2 } from "lucide-react";

import { editQuestionSchema } from "../../validations/question";
import { validateWithZod } from "../../validations/validate";
import { upload } from "../../services/createAPIs";
import { errorToast, successToast } from "../toast/Toast";

import Input from "../shared/Input";
import Textarea from "../shared/Textarea";
import Select from "../shared/Select";
import FileUpload from "../shared/FileUpload";
import PreviewModal from "../shared/PreviewModal";
import { getQuestionById, updateQuestion } from "../../services/getAPIs";

const EditQuestion = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    text: "",
    textType: "",
    images: [],
    imageUUID: "",
    type: "",
    options: ["", "", "", ""],
    answer: "",
    hint: "",
    explanation: "",
  });

  const [error, setError] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🧠 Fetch question data on mount
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const response = await getQuestionById(questionId);
        const q = response;

        if (!q) {
          errorToast("Question not found");
          return;
        }

        setForm({
          text: q.text || "",
          textType: q.textType || "",
          images: q.image?.files || [],
          imageUUID: q.image?.uuid,
          type: q.type || "",
          options: q.options?.length ? q.options : ["", "", "", ""],
          answer: q.answer || "",
          hint: q.hint || "",
          explanation: q.explanation || "",
        });
      } catch (err) {
        errorToast(
          err?.response?.data?.message ||
            err.message ||
            "Failed to load question"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

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

  // 🧾 Submit (edit) handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({});

    const validationResult = validateWithZod(editQuestionSchema, form);
    if (!validationResult.success) {
      console.log(validationResult.errors);
      setError(validationResult.errors);
      errorToast("Check all required fields");
      return;
    }

    setSaving(true);
    try {
      // --- Separate files vs URLs ---
      const newFiles = form.images?.filter((img) => img instanceof File) || [];
      const existingUrls =
        form.images?.filter((img) => typeof img === "string") || [];

      let uploadData = {};
      if (newFiles.length > 0) {
        uploadData = await upload(newFiles);
      }

      // --- Merge new uploads + existing URLs ---
      const uploadedUrls = uploadData.image_urls || [];
      const allUrls = [...existingUrls, ...uploadedUrls];
      const imageUUID = uploadData.image_id || form.imageUUID || null;

      // --- Final payload ---
      const payload = {
        text: form.text,
        textType: form.textType,
        images: allUrls,
        imageUUID,
        type: form.type,
        options: form.options,
        answer: form.answer,
        hint: form.hint,
        explanation: form.explanation,
      };

      const response = await updateQuestion(questionId, payload);
      successToast(response?.message || "Question updated successfully");
      navigate(
        `/user/question/created?page=${
          searchParams?.get("page") || state?.page
        }`
      );
    } catch (err) {
      errorToast(
        err?.response?.data?.message ||
          err.message ||
          "Failed to update question"
      );
    } finally {
      setSaving(false);
    }
  };

  return loading ? (
    <p className="text-white text-sm py-24 w-full flex justify-center items-center">
      <Loader2 size={40} className="animate-spin" />
    </p>
  ) : (
    <div className="mx-auto px-6 py-10 w-full">
      <form
        onSubmit={handleSubmit}
        className="p-8 rounded-xl shadow-lg space-y-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Select
            label="Text Type"
            selectedOption={form.textType}
            onSelect={(value) =>
              setForm((prev) => ({ ...prev, textType: value }))
            }
            options={[
              { label: "Text", value: "text" },
              { label: "Markdown", value: "markdown" },
              { label: "Latex", value: "latex" },
            ]}
            error={error?.textType}
            disabled={saving}
          />

          <Select
            label="Question Type"
            selectedOption={form.type}
            onSelect={(value) => setForm((prev) => ({ ...prev, type: value }))}
            options={[
              { label: "Input", value: "input" },
              { label: "Multiple", value: "multiple" },
            ]}
            error={error?.type}
            disabled={saving}
          />
        </div>

        <Suspense fallback={<div>Loading uploader...</div>}>
          <FileUpload
            onSelect={handleImageSelect}
            value={form.images}
            error={error?.images}
            disabled={saving}
          />
        </Suspense>

        <Textarea
          label="Question"
          name="text"
          value={form.text}
          onChange={handleChange}
          error={error?.text}
          disabled={saving}
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
                disabled={saving}
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
          disabled={saving}
          rows={1}
        />
        <Textarea
          label="Hint"
          name="hint"
          value={form.hint}
          onChange={handleChange}
          error={error?.hint}
          disabled={saving}
        />
        <Textarea
          label="Explanation"
          name="explanation"
          value={form.explanation}
          onChange={handleChange}
          error={error?.explanation}
          disabled={saving}
        />

        <PreviewModal
          question={form.text}
          options={form.options}
          answer={form.answer}
          hint={form.hint}
          explanation={form.explanation}
          images={form.images}
        />

        <div className="pt-4">
          <button
            type="submit"
            className="w-full cursor-pointer bg-black border hover:bg-white hover:text-black text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
          >
            {saving ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditQuestion;
