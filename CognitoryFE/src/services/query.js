import { useQuery } from "@tanstack/react-query";
import {
  getClasses,
  getLevels,
  getSubjects,
  getSubtopics,
  getTopics,
} from "./getAPIs";

export const useQueryObject = ({
  enterpriseId = null,
  classId = null,
  subjectId = null,
  topicId = null,
  subtopicId = null,
}) => {
  const classes = useQuery({
    queryKey: ["class", enterpriseId],
    queryFn: () => getClasses(enterpriseId),
    enabled: !!enterpriseId,
  });

  const subjects = useQuery({
    queryKey: ["subject", classId],
    queryFn: () => getSubjects(classId),
    enabled: !!classId,
  });

  const topics = useQuery({
    queryKey: ["topics", subjectId],
    queryFn: () => getTopics(subjectId),
    enabled: !!subjectId,
  });

  const subtopics = useQuery({
    queryKey: ["subtopics", topicId],
    queryFn: () => getSubtopics(topicId),
    enabled: !!topicId,
  });

  const levels = useQuery({
    queryKey: ["levels", subtopicId],
    queryFn: () => getLevels(subtopicId),
    enabled: !!subtopicId,
  });

  return {
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
  };
};
