import { useQuery } from "@tanstack/react-query";
import {
  getAllQuestion,
  getAllUsers,
  getClasses,
  getEnterprise,
  getLevels,
  getSubjects,
  getSubtopics,
  getTopics,
  getUserProfile,
} from "./getAPIs";
import { useSelector } from "react-redux";
import { matchPath, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";

export const useQueryObject = ({
  enterpriseId = null,
  classId = null,
  subjectId = null,
  topicId = null,
  subtopicId = null,
  approved = null,
  reviewed = null,
  userId = null,
  image = false,
  pageNumber = null,
}) => {
  const { pathname } = useLocation();
  const role = useSelector((state) => state?.user?.user?.role);
  const token = localStorage.getItem("token");
  const [page, setPage] = useState(pageNumber ? pageNumber : 1);

  const isLoggedIn = !!token;

  // ===================== USERS LIST FOR ADMIN =====================

  const shouldFetchUsers =
    isLoggedIn && role !== "user" && ["/admin/user/all"].includes(pathname);

  const usersForAdminQuery = useQuery({
    queryKey: ["users", token],
    queryFn: getAllUsers,
    enabled: shouldFetchUsers,
  });

  // ===================== USER PROFILE =====================
  const userQuery = useQuery({
    queryKey: ["user-profile", userId, token],
    queryFn: () => getUserProfile(userId),
    enabled: isLoggedIn && !!userId,
  });

  // ===================== ENTERPRISE =====================
  const enterpriseQuery = useQuery({
    queryKey: ["enterprise", role, token],
    queryFn: getEnterprise,
    enabled: isLoggedIn && role === "super",
  });

  // ===================== CLASS =====================
  const classesQuery = useQuery({
    queryKey: ["class", enterpriseId, role, token],
    queryFn: () => getClasses(enterpriseId, role),
    enabled: isLoggedIn && !!enterpriseId,
  });

  // ===================== SUBJECT =====================
  const subjectsQuery = useQuery({
    queryKey: ["subject", classId, role, token],
    queryFn: () => getSubjects(classId, role),
    enabled: isLoggedIn && !!classId,
  });

  // ===================== TOPIC =====================
  const topicsQuery = useQuery({
    queryKey: ["topics", subjectId, role, token],
    queryFn: () => getTopics(subjectId, role),
    enabled: isLoggedIn && !!subjectId,
  });

  // ===================== SUBTOPIC =====================
  const subtopicsQuery = useQuery({
    queryKey: ["subtopics", topicId, role, token],
    queryFn: () => getSubtopics(topicId, role),
    enabled: isLoggedIn && !!topicId,
  });

  // ===================== LEVEL =====================
  const levelsQuery = useQuery({
    queryKey: ["levels", subtopicId, role, token],
    queryFn: () => getLevels(subtopicId, role),
    enabled: isLoggedIn && !!subtopicId,
  });

  // ===================== QUESTION LIST =====================

  const shouldFetchQuestions = useMemo(() => {
    const questionFetchPaths = [
      "/user/question/reviewed",
      "/user/question/created",
      "/admin/question/all",
      "/admin/review/all",
      "/admin/question/user/:userId",
    ];
    return (
      isLoggedIn &&
      questionFetchPaths.some((route) => matchPath(route, pathname))
    );
  }, [isLoggedIn, pathname]);

  const isReadyForQuery = useMemo(() => {
    if (!shouldFetchQuestions) return false;

    // For routes that need no filter
    if (
      pathname === "/user/question/created" ||
      pathname === "/admin/question/all"
    ) {
      return true;
    }

    // For routes that need specific filters
    if (pathname === "/user/question/reviewed") {
      return reviewed !== undefined;
    }

    if (pathname === "/admin/review/all") {
      return approved !== undefined;
    }

    if (pathname.startsWith("/admin/question/user/")) {
      return userId !== undefined;
    }

    return false;
  }, [shouldFetchQuestions, approved, reviewed, userId, pathname]);

  const questionsQuery = useQuery({
    queryKey: [
      "questions",
      approved,
      reviewed,
      userId,
      image,
      classId,
      subjectId,
      topicId,
      page,
      role,
    ],
    queryFn: () =>
      getAllQuestion(
        approved,
        reviewed,
        userId,
        image,
        classId,
        subjectId,
        topicId,
        role,
        page
      ),
    enabled: isReadyForQuery,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  // ===================== RETURNED OBJECT =====================
  return {
    // User profile
    user: userQuery?.data,
    userQuery,

    usersForAdmin: usersForAdminQuery?.data,
    usersForAdminQuery,

    // Other filters
    enterprises: enterpriseQuery?.data,
    enterpriseQuery,

    classes: classesQuery?.data,
    classesQuery,

    subjects: subjectsQuery?.data,
    subjectsQuery,

    topics: topicsQuery?.data,
    topicsQuery,

    subtopics: subtopicsQuery?.data,
    subtopicsQuery,

    levels: levelsQuery?.data,
    levelsQuery,

    questions: questionsQuery?.data,
    questionsQuery,

    // Pagination
    page,
    setPage,
  };
};
