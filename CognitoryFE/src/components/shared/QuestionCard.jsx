import React, { useState } from "react";
import { ChevronDown, Loader2, Star, Trash } from "lucide-react";
import { useSelector } from "react-redux";
import { deleteQuestion } from "../../services/deleteAPIs";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { useQueryObject } from "../../services/query";

const Chip = ({ label, color }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs backdrop-blur-md ${color} text-white font-medium shadow`}
  >
    {label}
  </span>
);

const Stars = ({ rating = 0 }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"
        }
      />
    ))}
  </div>
);

const Section = ({ title, children }) => (
  <div className="gap-x-2 flex items-center">
    <h4 className="text-sm font-semibold text-white/70">{title}:</h4>
    <div className="text-sm text-white break-words">{children}</div>
  </div>
);

const QuestionCard = ({ question, shouldOpen = false, shouldClose = true }) => {
  const role = useSelector((state) => state?.user?.user?.role);
  const [isOpen, setIsOpen] = useState(shouldOpen);
  const [showDelete, setShowDelete] = useState(shouldOpen);
  const [loading, setLoading] = useState(shouldOpen);
  const { questionsQuery } = useQueryObject({});

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await deleteQuestion(question?._id);
      toast.success("Question deleted succesfully");
      setShowDelete(false);
      await questionsQuery.refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    if (!shouldClose) {
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const {
    text,
    textType,
    type,
    options,
    answer,
    hint,
    explanation,
    creator,
    enterprise,
    class: classObj,
    subject,
    topic,
    subtopic,
    level,
    review,
    image,
    createdAt,
    updatedAt,
    deletedAt,
  } = question;

  return (
    <div className="w-full mx-auto my-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-lg shadow-lg text-white transition-all overflow-hidden">
      {/* Accordion Header */}
      <div
        onClick={toggleOpen}
        className="flex items-center justify-between gap-4 p-6 cursor-pointer hover:bg-white/5 transition-all"
      >
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex flex-wrap gap-2">
            {enterprise?.name && <Chip label={`${enterprise.name}`} />}
            {classObj?.name && (
              <Chip label={`${classObj.name}`} color="bg-indigo-500/20" />
            )}
            {subject?.name && (
              <Chip label={`${subject.name}`} color="bg-blue-500/20" />
            )}
            {topic?.name && (
              <Chip label={`${topic.name}`} color="bg-purple-500/20" />
            )}
            {subtopic?.name && (
              <Chip label={`${subtopic.name}`} color="bg-pink-500/20" />
            )}
            {level?.name && (
              <Chip
                label={`Level: ${level.rank}-${level.name}`}
                color="bg-teal-500/20"
              />
            )}
            <Chip
              label={review?.reviewedAt ? "Reviewed" : "Not Reviewed"}
              color={review?.reviewedAt ? "bg-green-500/20" : "bg-red-500/20"}
            />
            {review?.reviewedAt && (
              <Chip
                label={review?.reviewedAt ? "Aprroved" : "Not Approved"}
                color={review?.reviewedAt ? "bg-green-500/20" : "bg-red-500/20"}
              />
            )}

            {review?.editAllowed && (
              <Chip label={"Editable"} color={"bg-green-500/20"} />
            )}
          </div>

          <h3
            className={`text-base font-semibold leading-snug text-white/90 transition-all duration-300 ease-in-out ${
              isOpen
                ? "opacity-0 h-0 pointer-events-none"
                : "opacity-100 h-auto line-clamp-2"
            }`}
          >
            {text}
          </h3>
        </div>

        {!deletedAt && role !== "user" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDelete(true);
            }}
            className="bg-red-900 p-2 rounded-lg cursor-pointer"
          >
            <Trash className="h-4 w-4" />
          </button>
        )}

        {shouldClose && (
          <ChevronDown
            size={20}
            className={`transform transition-transform duration-100 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        )}
      </div>

      {/* Accordion Body */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden border-t border-white/10 ${
          isOpen ? "max-h-screen" : "max-h-0"
        }`}
      >
        <div className="p-6 space-y-2 text-sm flex flex-col ">
          {/* Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Section title="Question Type">{type}</Section>
              <Section title="Text Type">{textType || "text"}</Section>
            </div>
            <div className="space-y-3">
              <Section title="Reviewer Comment">
                {review.comment || "None"}
              </Section>
              <Section title="Rating">
                <Stars rating={review?.rating || 0} />
              </Section>
            </div>
          </div>

          {/* Images Carousel */}
          <div className="flex flex-col justify-center items-center">
            {image?.files?.length > 0 && (
              <>
                <div className="overflow-x-auto flex gap-4 pb-2">
                  {image.files.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`img-${i}`}
                      className="h-36 rounded-lg border border-white/30 object-contain shadow min-w-[9rem]"
                    />
                  ))}
                </div>
                {image.uuid && (
                  <Section title="Image UUID">
                    <span className="text-white/80 break-all">
                      {image.uuid}
                    </span>
                  </Section>
                )}
              </>
            )}
          </div>

          {/* Content: Question, Answer, Hint, Explanation */}
          <div className="space-y-4">
            <Section title="Question">{text}</Section>
            {answer && <Section title="Answer">{answer}</Section>}
            {hint && <Section title="Hint">{hint}</Section>}
            {explanation && (
              <Section title="Explanation">{explanation}</Section>
            )}
          </div>

          {/* Multiple Options */}
          {type === "multiple" && options?.filter(Boolean)?.length > 0 && (
            <Section title="Options">
              <ul className="list-disc list-inside pl-4 space-y-1">
                {options.map(
                  (opt, idx) =>
                    opt && (
                      <li key={idx}>
                        <strong>Option {idx + 1}:</strong>{" "}
                        <span className="break-words">{opt}</span>
                      </li>
                    )
                )}
              </ul>
            </Section>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-white/20 text-xs text-white/50 space-y-1">
            {creator?.name && (
              <p>
                <strong>Creator:</strong> {creator.name}
              </p>
            )}
            {creator?.email && (
              <p>
                <strong>Creator:</strong> {creator.email}
              </p>
            )}
            {createdAt && (
              <p>
                <strong>Created:</strong> {new Date(createdAt).toLocaleString()}
              </p>
            )}
            {updatedAt && (
              <p>
                <strong>Updated:</strong> {new Date(updatedAt).toLocaleString()}
              </p>
            )}
            {review?.reviewedAt && (
              <p>
                <strong>Reviewed:</strong>{" "}
                {new Date(review?.reviewedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {showDelete && (
        <Modal
          onClose={() => {
            if (loading) return;
            setShowDelete(false);
          }}
        >
          <h3 className="text-lg font-semibold mb-3">Delete Question</h3>
          <p className="text-sm mb-4 text-white">
            Are you sure you want to delete this question?
          </p>
          <button
            onClick={handleDelete}
            disabled={loading}
            className={`w-full bg-white text-black hover:bg-white hover:text-black cursor-pointer py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Confirm
          </button>
        </Modal>
      )}
    </div>
  );
};

export default QuestionCard;
