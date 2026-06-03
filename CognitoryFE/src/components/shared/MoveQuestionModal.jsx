import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";

import Modal from "./Modal";
import Select from "./Select";
import { errorToast, successToast } from "../toast/Toast";
import {
  getClasses,
  getLevels,
  getSubjects,
  getSubtopics,
  getTopics,
} from "../../services/getAPIs";
import { moveQuestion } from "../../services/updateAPIs";

const LocationBadge = ({ label, color }) => (
  <span className={`text-xs px-2 py-1 rounded-full ${color}`}>{label}</span>
);

const MoveQuestionModal = ({ question, onClose }) => {
  const role = useSelector((state) => state?.user?.user?.role);
  const queryClient = useQueryClient();
  const enterpriseId = import.meta.env.VITE_ENTERPRISE_ID;

  const [classId, setClassId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [topicId, setTopicId] = useState(null);
  const [subtopicId, setSubtopicId] = useState(null);
  const [levelId, setLevelId] = useState(null);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [levels, setLevels] = useState([]);

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoadingClasses(true);
      const data = await getClasses(enterpriseId, role);
      setClasses(data?.classes || []);
      setLoadingClasses(false);
    };
    fetch();
  }, [enterpriseId, role]);

  useEffect(() => {
    if (!classId) {
      setSubjects([]);
      setSubjectId(null);
      return;
    }
    const fetch = async () => {
      setLoadingSubjects(true);
      const data = await getSubjects(classId, role);
      setSubjects(data?.subjects || []);
      setLoadingSubjects(false);
    };
    fetch();
  }, [classId]);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setTopicId(null);
      return;
    }
    const fetch = async () => {
      setLoadingTopics(true);
      const data = await getTopics(subjectId, role);
      setTopics(data?.topics || []);
      setLoadingTopics(false);
    };
    fetch();
  }, [subjectId]);

  useEffect(() => {
    if (!topicId) {
      setSubtopics([]);
      setSubtopicId(null);
      return;
    }
    const fetch = async () => {
      setLoadingSubtopics(true);
      const data = await getSubtopics(topicId, role);
      setSubtopics(data?.subtopics || []);
      setLoadingSubtopics(false);
    };
    fetch();
  }, [topicId]);

  useEffect(() => {
    if (!subtopicId) {
      setLevels([]);
      setLevelId(null);
      return;
    }
    const fetch = async () => {
      setLoadingLevels(true);
      const data = await getLevels(subtopicId, role);
      setLevels(data?.levels || []);
      setLoadingLevels(false);
    };
    fetch();
  }, [subtopicId]);

  const handleMove = async () => {
    if (!classId || !subjectId || !topicId || !subtopicId || !levelId) {
      errorToast("Please select all destination fields");
      return;
    }

    setSaving(true);
    try {
      await moveQuestion(question._id, {
        enterpriseId,
        classId,
        subjectId,
        topicId,
        subtopicId,
        levelId,
      });
      successToast("Question moved successfully");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      onClose();
    } catch (err) {
      errorToast(
        err?.response?.data?.message || err.message || "Failed to move question"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={saving ? undefined : onClose} title="Move Question">
      <div className="space-y-5">
        {/* Current location */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-2">
            Current Location
          </p>
          <div className="flex flex-wrap gap-2">
            {question.class?.name && (
              <LocationBadge
                label={question.class.name}
                color="bg-indigo-500/20"
              />
            )}
            {question.subject?.name && (
              <LocationBadge
                label={question.subject.name}
                color="bg-blue-500/20"
              />
            )}
            {question.topic?.name && (
              <LocationBadge
                label={question.topic.name}
                color="bg-purple-500/20"
              />
            )}
            {question.subtopic?.name && (
              <LocationBadge
                label={question.subtopic.name}
                color="bg-pink-500/20"
              />
            )}
            {question.level?.name && (
              <LocationBadge
                label={`Level ${question.level.rank}: ${question.level.name}`}
                color="bg-teal-500/20"
              />
            )}
          </div>
        </div>

        {/* Destination */}
        <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">
          Select Destination
        </p>

        <Select
          label="Class"
          selectedOption={classId}
          onSelect={(value) => {
            setClassId(value);
            setSubjectId(null);
            setTopicId(null);
            setSubtopicId(null);
            setLevelId(null);
          }}
          options={classes.map((c) => ({ label: c.name, value: c._id }))}
          loading={loadingClasses}
          disabled={saving}
        />

        <Select
          label="Subject"
          selectedOption={subjectId}
          onSelect={(value) => {
            setSubjectId(value);
            setTopicId(null);
            setSubtopicId(null);
            setLevelId(null);
          }}
          options={subjects.map((s) => ({ label: s.name, value: s._id }))}
          loading={loadingSubjects}
          disabled={!classId || saving}
        />

        <Select
          label="Topic"
          selectedOption={topicId}
          onSelect={(value) => {
            setTopicId(value);
            setSubtopicId(null);
            setLevelId(null);
          }}
          options={topics.map((t) => ({ label: t.name, value: t._id }))}
          loading={loadingTopics}
          disabled={!subjectId || saving}
        />

        <Select
          label="Subtopic"
          selectedOption={subtopicId}
          onSelect={(value) => {
            setSubtopicId(value);
            setLevelId(null);
          }}
          options={subtopics.map((s) => ({ label: s.name, value: s._id }))}
          loading={loadingSubtopics}
          disabled={!topicId || saving}
        />

        <Select
          label="Level"
          selectedOption={levelId}
          onSelect={setLevelId}
          options={levels.map((l) => ({
            label: `${l.rank} - ${l.name}`,
            value: l._id,
          }))}
          loading={loadingLevels}
          disabled={!subtopicId || saving}
        />

        <button
          onClick={handleMove}
          disabled={saving || !levelId}
          className={`w-full cursor-pointer bg-black border hover:bg-white hover:text-black text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 ${
            saving || !levelId ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            "Move Question"
          )}
        </button>
      </div>
    </Modal>
  );
};

export default MoveQuestionModal;
