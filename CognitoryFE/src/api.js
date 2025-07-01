import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const api = axios.create({
  baseURL: "https://cognitory.onrender.com/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

export const getClasses = async (enterpriseId) => {
  try {
    const response = api.get(`/class?enterpriseId=${enterpriseId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getSubjects = async (classId) => {
  try {
    const response = api.get(`/subject?classId=${classId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getTopics = async (subjectId) => {
  try {
    const response = api.get(`/topic?subjectId=${subjectId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getSubtopics = async (topicId) => {
  try {
    const response = api.get(`/subtopic?topicId=${topicId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getLevels = async (subtopicId) => {
  try {
    const response = api.get(`/level?subtopicId=${subtopicId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const upload = async (filesArray) => {
  try {
    const uuid = uuidv4();
    const formData = new FormData();

    filesArray.forEach((file) => {
      formData.append("file", file); // use same key for multiple files
    });

    formData.append("uuid", uuid);

    const response = await api.post("/util/upload", formData);
    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const createQuestion = async (data) => {
  try {
    const response = await api.post("/question", data);
    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};
