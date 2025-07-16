import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import Modal from "./Modal";

const PreviewModal = ({
  question,
  answer,
  options = [],
  hint,
  explanation,
  images = [],
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full cursor-pointer bg-black border hover:bg-white hover:text-black text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
      >
        View Preview
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="min-w-[50vw] border border-white/20 bg-zinc-900 rounded-lg w-full px-6 py-8 space-y-8">
            {/* Image Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`image-${idx}`}
                    className="h-40 w-full object-contain rounded-lg border border-white/10"
                  />
                ))}
              </div>
            )}

            {/* Card Content */}
            <div className="text-white space-y-6">
              {/* Question */}
              {question && (
                <Section title="Question">
                  <MarkdownRender content={question} />
                </Section>
              )}

              {/* Options */}
              {options?.length > 0 && (
                <Section title="Options">
                  <ul className="list-disc list-inside space-y-1">
                    {options.map((opt, idx) => (
                      <li key={idx}>
                        <MarkdownRender content={opt} inline />
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Answer */}
              {answer && (
                <Section title="Answer">
                  <MarkdownRender content={answer} />
                </Section>
              )}

              {/* Hint */}
              {hint && (
                <Section title="Hint">
                  <MarkdownRender content={hint} />
                </Section>
              )}

              {/* Explanation */}
              {explanation && (
                <Section title="Explanation">
                  <MarkdownRender content={explanation} />
                </Section>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// Reusable Section
const Section = ({ title, children }) => (
  <div className="space-y-2">
    <h3 className="text-lg font-semibold text-white">{title}:</h3>
    <div className="prose prose-invert max-w-none">{children}</div>
  </div>
);

// Markdown + Math Renderer
const MarkdownRender = ({ content, inline = false }) => (
  <ReactMarkdown
    children={content}
    remarkPlugins={[remarkMath]}
    rehypePlugins={[rehypeKatex]}
    components={
      inline
        ? {
            p: ({ children }) => <>{children}</>,
          }
        : {}
    }
  />
);

export default PreviewModal;
