import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { api } from "./api";

export const getClasses = async (enterpriseId) => {
  try {
    const response = await api.get(
      `/class?enterpriseId=${enterpriseId}&paginate=false`
    );

    return response?.data?.data?.classes?.map((item) => ({
      value: item?._id,
      label: item?.name,
    }));
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getSubjects = async (classId) => {
  try {
    const response = await api.get(
      `/subject?classId=${classId}&paginate=false`
    );
    return response?.data?.data?.subjects?.map((item) => ({
      value: item?._id,
      label: item?.name,
    }));
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getTopics = async (subjectId) => {
  try {
    const response = await api.get(
      `/topic?subjectId=${subjectId}&paginate=false`
    );
    return response?.data?.data?.topics?.map((item) => ({
      value: item?._id,
      label: item?.name,
    }));
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getSubtopics = async (topicId) => {
  try {
    const response = await api.get(
      `/subtopic?topicId=${topicId}&paginate=false`
    );
    return response?.data?.data?.subtopics?.map((item) => ({
      value: item?._id,
      label: item?.name,
    }));
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getLevels = async (subtopicId) => {
  try {
    const response = await api.get(
      `/level?subtopicId=${subtopicId}&paginate=false`
    );
    return response?.data?.data?.levels?.map((item) => ({
      value: item?._id,
      label: `${item?.rank} - ${item?.name} `,
    }));
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
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
