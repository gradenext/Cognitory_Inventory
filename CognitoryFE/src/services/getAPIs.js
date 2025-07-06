import toast from "react-hot-toast";
import { api } from "./api";

export const getClasses = async (enterpriseId) => {
  try {
    const response = await api.get(
      `/class?enterpriseId=${enterpriseId}&paginate=false&filterDeleted=true`
    );

    return response?.data?.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getSubjects = async (classId) => {
  try {
    const response = await api.get(
      `/subject?classId=${classId}&paginate=false&filterDeleted=true`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getTopics = async (subjectId) => {
  try {
    const response = await api.get(
      `/topic?subjectId=${subjectId}&paginate=false&filterDeleted=true`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getSubtopics = async (topicId) => {
  try {
    const response = await api.get(
      `/subtopic?topicId=${topicId}&paginate=false&filterDeleted=true`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getLevels = async (subtopicId) => {
  try {
    const response = await api.get(
      `/level?subtopicId=${subtopicId}&paginate=false&filterDeleted=true`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getAllUsers = async () => {
  try {
    const response = await api.get(`/user`);
    return response?.data?.users;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};
