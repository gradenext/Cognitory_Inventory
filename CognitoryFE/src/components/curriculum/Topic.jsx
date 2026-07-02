import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryObject } from "../../services/query";
import Add from "./Add";
import SubtopicCard from "./SubtopicCard";
import TopicContentManager from "./TopicContentManager";
import { Loader2, BookOpen, FileText } from "lucide-react";

const TABS = [
  { id: "subtopics", label: "Subtopics", icon: BookOpen },
  { id: "content",   label: "Content",   icon: FileText },
];

const Topic = () => {
  const { topicId } = useParams();
  const { subtopics, subtopicsQuery } = useQueryObject({ topicId });
  const [activeTab, setActiveTab] = useState("subtopics");

  const isLoading = subtopicsQuery?.isLoading;
  const isEmpty = !isLoading && (!subtopics?.subtopics || subtopics.subtopics.length === 0);

  return (
    <div className="p-6 flex flex-col items-center">

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl self-start"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition"
            style={activeTab === id
              ? { background: "rgba(99,102,241,0.4)", color: "#a5b4fc" }
              : { color: "rgba(255,255,255,0.4)" }
            }
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Subtopics tab */}
      {activeTab === "subtopics" && (
        <>
          <Add type="subtopic" />
          <div className="p-6 w-full flex flex-wrap gap-x-6 gap-y-4">
            {isLoading ? (
              <p className="text-white text-sm py-24 w-full flex justify-center items-center">
                <Loader2 size={40} className="animate-spin" />
              </p>
            ) : isEmpty ? (
              <p className="text-white text-lg italic py-24 w-full flex justify-center items-center">
                No subtopics available yet.
              </p>
            ) : (
              subtopics?.subtopics.map((sub) => (
                <SubtopicCard key={sub._id} data={sub} />
              ))
            )}
          </div>
        </>
      )}

      {/* Content tab */}
      {activeTab === "content" && (
        <div className="w-full max-w-2xl">
          <TopicContentManager topicId={topicId} />
        </div>
      )}
    </div>
  );
};

export default Topic;
