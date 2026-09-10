import { api } from "./api";
import { errorToast } from "../components/toast/Toast";

export const getTopicIntroSummaries = async (topicId) => {
  try {
    const response = await api.get(`/topic/${topicId}/intro-summary`);
    return response?.data?.data;
  } catch (error) {
    errorToast(error.response?.data?.message);
    return { summaries: [], total: 0 };
  }
};

export const createTopicIntroSummary = async (topicId, data) => {
  try {
    const response = await api.post(`/topic/${topicId}/intro-summary`, data);
    return response?.data;
  } catch (error) {
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const uploadTopicIntroSummaryFile = async (topicId, summaryId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/topic/${topicId}/intro-summary/${summaryId}/upload`, formData);
    return response?.data;
  } catch (error) {
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const updateTopicIntroSummary = async (topicId, summaryId, data) => {
  try {
    const response = await api.patch(`/topic/${topicId}/intro-summary/${summaryId}`, data);
    return response?.data;
  } catch (error) {
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const deleteTopicIntroSummary = async (topicId, summaryId) => {
  try {
    const response = await api.delete(`/topic/${topicId}/intro-summary/${summaryId}`);
    return response?.data;
  } catch (error) {
    errorToast(error.response?.data?.message);
    throw error;
  }
};
