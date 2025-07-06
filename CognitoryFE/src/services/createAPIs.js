import toast from "react-hot-toast";
import { api } from "./api";
import { v4 as uuidv4 } from "uuid";

export const upload = async (filesArray) => {
  try {
    const uuid = uuidv4();
    const formData = new FormData();

    filesArray.forEach((file) => {
      formData.append("file", file); // use same key for multiple files
    });

    formData.append("uuid", uuid);

    const response = await api.post("/util/upload", formData);
    return response?.data?.data;
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.response?.data?.message);
  }
};

export const createQuestion = async (data) => {
  try {
    const response = await api.post("/question", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.response?.data?.message);
  }
};

export const createEnterprise = async (data) => {
  try {
    const response = await api.post("/enterprise", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.response?.data?.message);
  }
};

export const createClass = async (data) => {
  try {
    const response = await api.post("/class", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.response?.data?.message);
  }
};

export const createSubject = async (data) => {
  try {
    const response = await api.post("/subject", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.response?.data?.message);
  }
};

export const createTopic = async (data) => {
  try {
    const response = await api.post("/topic", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.response?.data?.message);
  }
};

export const createSubtopic = async (data) => {
  try {
    const response = await api.post("/subtopic", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.response?.data?.message);
  }
};

export const createLevel = async (data) => {
  try {
    const response = await api.post("/level", data);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.response?.data?.message);
  }
};
