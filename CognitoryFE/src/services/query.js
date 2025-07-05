import { useQuery } from "@tanstack/react-query";
import {
  getClasses,
  getLevels,
  getSubjects,
  getSubtopics,
  getTopics,
} from "./getAPIs";

export const useQueryObject = (
  enterpriseId,
  classId,
  subjectId,
  topicId,
  subtopicId
) => {
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

  return { classes, subjects, topics, subtopics, levels };
};
