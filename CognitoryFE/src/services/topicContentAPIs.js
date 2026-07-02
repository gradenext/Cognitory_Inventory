import { api } from "./api";
import { errorToast } from "../components/toast/Toast";

export const getTopicContents = async (topicId) => {
  try {
    const response = await api.get(`/topic/${topicId}/content`);
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return { contents: [], total: 0 };
  }
};

export const createTopicContent = async (topicId, data) => {
  try {
    const response = await api.post(`/topic/${topicId}/content`, data);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const updateTopicContent = async (topicId, contentId, data) => {
  try {
    const response = await api.patch(`/topic/${topicId}/content/${contentId}`, data);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const uploadTopicContentFile = async (topicId, contentId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/topic/${topicId}/content/${contentId}/upload`, formData);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const deleteTopicContent = async (topicId, contentId) => {
  try {
    const response = await api.delete(`/topic/${topicId}/content/${contentId}`);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};
