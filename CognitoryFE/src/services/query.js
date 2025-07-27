import { useQuery } from "@tanstack/react-query";
import {
  getAllQuestion,
  getClasses,
  getEnterprise,
  getLevels,
  getSubjects,
  getSubtopics,
  getTopics,
} from "./getAPIs";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useState } from "react";

export const useQueryObject = ({
  enterpriseId = null,
  classId = null,
  subjectId = null,
  topicId = null,
  subtopicId = null,
  approved,
  reviewed,
}) => {
  const { pathname } = useLocation();
  const role = useSelector((state) => state?.user?.user?.role);
  const token = localStorage.getItem("token");
  const [page, setPage] = useState(1);

  const enterprises = useQuery({
    queryKey: ["enterprise", role],
    queryFn: () => getEnterprise(),
    enabled: role === "super" && token,
  });

  const classes = useQuery({
    queryKey: ["class", enterpriseId, role],
    queryFn: () => getClasses(enterpriseId, role),
    enabled: !!enterpriseId && !!token,
  });

  const subjects = useQuery({
    queryKey: ["subject", classId, role],
    queryFn: () => getSubjects(classId, role),
    enabled: !!classId && !!token,
  });

  const topics = useQuery({
    queryKey: ["topics", subjectId, role],
    queryFn: () => getTopics(subjectId, role),
    enabled: !!subjectId && !!token,
  });

  const subtopics = useQuery({
    queryKey: ["subtopics", topicId, role],
    queryFn: () => getSubtopics(topicId, role),
    enabled: !!topicId && !!token,
  });

  const levels = useQuery({
    queryKey: ["levels", subtopicId, role],
    queryFn: () => getLevels(subtopicId, role),
    enabled: !!subtopicId && !!token,
  });

  const shouldFetchQuestions =
    token &&
    [
      "/user/question/reviewed",
      "/user/question/created",
      "/admin/question/all",
      "/admin/review/all",
    ].includes(pathname);

  const questions = useQuery({
    queryKey: ["questions", approved, reviewed, page],
    queryFn: () => getAllQuestion(approved, reviewed, role, page),
    enabled: shouldFetchQuestions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  return {
    enterprises: enterprises?.data,
    enterpriseQuery: enterprises,

    classes: classes?.data,
    classesQuery: classes,

    subjects: subjects?.data,
    subjectsQuery: subjects,

    topics: topics?.data,
    topicsQuery: topics,

    subtopics: subtopics?.data,
    subtopicsQuery: subtopics,

    levels: levels?.data,
    levelsQuery: levels,

    questions: questions?.data,
    questionsQuery: questions,

    page,
    setPage,
  };
};
