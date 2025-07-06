import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Star } from "lucide-react";

const Chip = ({ label, color = "bg-white/20" }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs ${color} text-white font-medium`}
  >
    {label}
  </span>
);

const Stars = ({ rating = 0 }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        className={
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"
        }
      />
    ))}
  </div>
);

const QuestionCard = ({ question }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    } else if (contentRef.current) {
      contentRef.current.style.height = "0px";
    }
  }, [isOpen]);

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
  } = question;

  return (
    <div className="w-full mx-auto my-4 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 shadow-xl text-white overflow-hidden transition-all duration-300">
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/5 transition-all"
        onClick={toggleOpen}
      >
        <div className="space-y-1">
          <h3 className="text-lg font-semibold line-clamp-1">{text}</h3>
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            <Chip label={`Class: ${classObj.name}`} />
            <Chip label={`Subject: ${subject.name}`} />
            <Chip label={`Topic: ${topic.name}`} />
            <Chip label={`Subtopic: ${subtopic.name}`} />
            <Chip label={`Level: ${level.name}`} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review?.approved ? (
            <Chip label="Reviewed" color="bg-green-500/40" />
          ) : (
            <Chip label="Not Reviewed" color="bg-red-500/40" />
          )}
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </div>
      </div>

      <div
        ref={contentRef}
        className="transition-[height] duration-300 ease-in-out overflow-hidden border-t border-white/20"
        style={{ height: 0 }}
      >
        <div className="px-6 py-4 space-y-4">
          {image?.files?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {image.files.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt="uploaded"
                  className="h-32 rounded-lg border border-white/30"
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p>
                Text Type: <span className="font-medium">{textType}</span>
              </p>
              <p>
                Question Type: <span className="font-medium">{type}</span>
              </p>
              {type === "multiple" && (
                <ul className="list-disc list-inside space-y-1">
                  {options.map((opt, idx) => (
                    <li key={idx}>
                      <strong>Option {idx + 1}:</strong> {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-1">
              <p>
                <strong>Answer:</strong> {answer}
              </p>
              <p>
                <strong>Hint:</strong> {hint}
              </p>
              <p>
                <strong>Explanation:</strong> {explanation}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p>
                <strong>Creator:</strong> {creator?.name}
              </p>
              <p>
                <strong>Enterprise:</strong> {enterprise?.name}
              </p>
            </div>
            <div className="space-y-1">
              <p>
                <strong>Review Status:</strong>{" "}
                {review?.approved ? "Approved" : "Not Approved"}
              </p>
              {review?.comment && (
                <p>
                  <strong>Comment:</strong> {review.comment}
                </p>
              )}
              <div>
                <p className="mb-1">
                  <strong>Rating:</strong>
                </p>
                <Stars rating={review?.rating} />
              </div>
            </div>
          </div>

          <div className="text-xs text-white/50">
            <p>Created At: {new Date(createdAt).toLocaleString()}</p>
            <p>Updated At: {new Date(updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
