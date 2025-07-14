import { api } from "./api";

export const getEnterpriseById = async (enterpriseId) => {
  try {
    const response = await api.get(`/enterprise/${enterpriseId}`);
    return response?.data;
  } catch (error) {
    console.error("Get enterprise error:", error);
    throw error;
  }
};

export const getClassById = async (classId) => {
  try {
    const response = await api.get(`/class/${classId}`);
    return response?.data;
  } catch (error) {
    console.error("Get class error:", error);
    throw error;
  }
};

export const getSubjectById = async (subjectId) => {
  try {
    const response = await api.get(`/subject/${subjectId}`);
    return response?.data;
  } catch (error) {
    console.error("Get subject error:", error);
    throw error;
  }
};

export const getTopicById = async (topicId) => {
  try {
    const response = await api.get(`/topic/${topicId}`);
    return response?.data;
  } catch (error) {
    console.error("Get topic error:", error);
    throw error;
  }
};

export const getSubtopicById = async (subtopicId) => {
  try {
    const response = await api.get(`/subtopic/${subtopicId}`);
    return response?.data;
  } catch (error) {
    console.error("Get subtopic error:", error);
    throw error;
  }
};

export const getLevelById = async (levelId) => {
  try {
    const response = await api.get(`/level/${levelId}`);
    return response?.data;
  } catch (error) {
    console.error("Get level error:", error);
    throw error;
  }
};

export const getQuestionById = async (questionId) => {
  try {
    const response = await api.get(`/question/${questionId}`);
    return response?.data;
  } catch (error) {
    console.error("Get question error:", error);
    throw error;
  }
};
