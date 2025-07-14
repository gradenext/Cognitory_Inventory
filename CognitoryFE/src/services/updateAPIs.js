import { api } from "./api";

export const updateEnterprise = async (enterpriseId, data) => {
  try {
    const response = await api.patch(`/enterprise/${enterpriseId}`, data);
    return response?.data;
  } catch (error) {
    console.error("Update enterprise error:", error);
    throw error;
  }
};

export const updateClass = async (classId, data) => {
  try {
    const response = await api.patch(`/class/${classId}`, data);
    return response?.data;
  } catch (error) {
    console.error("Update class error:", error);
    throw error;
  }
};

export const updateSubject = async (subjectId, data) => {
  try {
    const response = await api.patch(`/subject/${subjectId}`, data);
    return response?.data;
  } catch (error) {
    console.error("Update subject error:", error);
    throw error;
  }
};

export const updateTopic = async (topicId, data) => {
  try {
    const response = await api.patch(`/topic/${topicId}`, data);
    return response?.data;
  } catch (error) {
    console.error("Update topic error:", error);
    throw error;
  }
};

export const updateSubtopic = async (subtopicId, data) => {
  try {
    const response = await api.patch(`/subtopic/${subtopicId}`, data);
    return response?.data;
  } catch (error) {
    console.error("Update subtopic error:", error);
    throw error;
  }
};

export const updateLevel = async (levelId, data) => {
  try {
    const response = await api.patch(`/level/${levelId}`, data);
    return response?.data;
  } catch (error) {
    console.error("Update level error:", error);
    throw error;
  }
};
