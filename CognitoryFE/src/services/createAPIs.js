import { api } from "./api";
import { errorToast } from "../components/toast/Toast";

export const upload = async (filesArray) => {
  try {
    const formData = new FormData();

    filesArray.forEach((file) => {
      formData.append("images", file);
    });

    const response = await api.post(
      "https://api.gradenext.com/api/upload-images/",
      formData
    );
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const createQuestion = async (data) => {
  try {
    const response = await api.post("/question", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const reviewQuestion = async (questionId, data) => {
  try {
    const response = await api.post(`/review/${questionId}`, data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const createEnterprise = async (data) => {
  try {
    const response = await api.post("/enterprise", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const createClass = async (data) => {
  try {
    const response = await api.post("/class", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const createSubject = async (data) => {
  try {
    const response = await api.post("/subject", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const createTopic = async (data) => {
  try {
    const response = await api.post("/topic", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const createSubtopic = async (data) => {
  try {
    const response = await api.post("/subtopic", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const createLevel = async (data) => {
  try {
    const response = await api.post("/level", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};
