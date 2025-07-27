import React, { useEffect, useState } from "react";
import { validateWithZod } from "../../validations/validate";
import { getSingleQuestionForReview } from "../../services/getAPIs";
import ToggleSwitch from "../shared/ToogleSwitch";
import Input from "../shared/Input";
import toast from "react-hot-toast";
import QuestionCard from "../shared/QuestionCard";
import { reviewSchema } from "../../validations/question";
import { Loader2 } from "lucide-react";
import { reviewQuestion } from "../../services/createAPIs";
import { useNavigate, useParams } from "react-router-dom";

const ReviewQuestion = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [form, setForm] = useState({
    approved: false,
    editAllowed: false,
    comment: "",
    rating: "",
  });
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);

  useEffect(() => {
    const getQuestion = async () => {
      setQuestionLoading(true);
      try {
        setQuestion(null);
        const res = await getSingleQuestionForReview(questionId);
        setQuestion(res);
      } catch (err) {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch question."
        );
      } finally {
        setQuestionLoading(false);
      }
    };
    getQuestion();
  }, [questionId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({});
    const payload = { ...form };

    const result = validateWithZod(reviewSchema, payload);
    if (!result.success) {
      console.log(result.errors);
      setError(result.errors);
      toast.error("Please check all fields");
      return;
    }

    try {
      setLoading(true);
      await reviewQuestion(question?._id, payload);
      toast.success("Review submitted!");
      navigate("/admin/review/all");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit review."
      );
    } finally {
      setLoading(false);
    }
  };

  if (questionLoading)
    return (
      <div className="text-white flex justify-center items-center h-screen w-full">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );

    console.log(question)

  if (!questionLoading && !question)
    return (
      <div className="h-screen flex justify-center items-center">
        <p className="text-white text-2xl italic py-24 w-full flex justify-center items-center">
          No Question for review available.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 ">
      {/* Left Side - Question */}
      <div className="w-full lg:w-1/2 overflow-y-auto">
        {question && (
          <QuestionCard
            question={question}
            shouldOpen={true}
            shouldClose={false}
          />
        )}
      </div>

      {/* Right Side - Review Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full h-fit md:sticky md:top-16 my-6 lg:w-1/2 bg-white/10 backdrop-blur border border-white/20 p-6 rounded-xl shadow space-y-6"
      >
        <h2 className="text-lg font-semibold text-white mb-2">
          Review This Question
        </h2>

        <div>
          <ToggleSwitch
            label={
              <span
                className={`font-medium ${
                  form.approved ? "text-green-400" : "text-white/70"
                }`}
              >
                Approved
              </span>
            }
            value={form.approved}
            onChange={(val) => handleToggle("approved", val)}
            onColor="bg-green-500"
            offColor="bg-white/20"
            thumbColor="bg-white"
          />
        </div>

        <div>
          <ToggleSwitch
            label={
              <span
                className={`font-medium ${
                  form.editAllowed ? "text-sky-400" : "text-white/70"
                }`}
              >
                Allow editing
              </span>
            }
            value={form.editAllowed}
            onChange={(val) => handleToggle("editAllowed", val)}
            onColor="bg-sky-500"
            offColor="bg-white/20"
            thumbColor="bg-white"
          />
        </div>

        <Input
          label="Comment"
          name="comment"
          value={form.comment}
          onChange={handleChange}
          placeholder="Write a comment (required if not approved)"
          error={error.comment}
          disabled={loading}
        />

        {/* Star Rating */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white">Rating</label>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                className={`text-xl transition cursor-pointer ${
                  Number(form.rating) >= num
                    ? "text-yellow-400"
                    : "text-white/20 hover:text-yellow-200"
                }`}
                onClick={() =>
                  handleChange({ target: { name: "rating", value: num } })
                }
              >
                ★
              </button>
            ))}
          </div>
          {error.rating && (
            <p className="text-red-400 text-xs mt-1">{error.rating}</p>
          )}
        </div>

        <button
          type="submit"
          className="bg-primaryColor flex justify-center text-white bg-black cursor-pointer hover:bg-white hover:text-black transition-colors duration-300 w-full py-2 px-4 rounded-lg disabled:opacity-50"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewQuestion;
