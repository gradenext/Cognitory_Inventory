import { api } from "./api";
import { errorToast } from "../components/toast/Toast";

export const getEnterprise = async (role = null) => {
  try {
    const response = await api.get(
      `/enterprise?filterDeleted=${role !== "super"}`
    );

    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return [];
  }
};

export const getClasses = async (enterpriseId, role = null) => {
  try {
    const response = await api.get(
      `/class?enterpriseId=${enterpriseId}&filterDeleted=${role !== "super"}`
    );

    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return [];
  }
};

export const getSubjects = async (classId, role = null) => {
  try {
    const response = await api.get(
      `/subject?classId=${classId}&filterDeleted=${role !== "super"}`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return [];
  }
};

export const getTopics = async (subjectId, role = null) => {
  try {
    const response = await api.get(
      `/topic?subjectId=${subjectId}&filterDeleted=${role !== "super"}`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return [];
  }
};

export const getSubtopics = async (topicId, role = null) => {
  try {
    const response = await api.get(
      `/subtopic?topicId=${topicId}&filterDeleted=${role !== "super"}`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return [];
  }
};

export const getLevels = async (subtopicId, role = null) => {
  try {
    const response = await api.get(
      `/level?subtopicId=${subtopicId}&filterDeleted=${role !== "super"}`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return [];
  }
};

export const getAllUsers = async () => {
  try {
    const response = await api.get(`/user`);
    return response?.data?.users;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return [];
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(
      `/user/profile${userId ? `?userId=${userId}` : ""}`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return {};
  }
};

export const getAllQuestion = async (
  approved = null,
  reviewed = null,
  userId = null,
  image = false,
  role = null,
  page = 1,
  limit = 20
) => {
  try {
    let query = [""];
    if (approved !== null) {
      query.push(`approved=${approved}`);
    }
    if (reviewed !== null) {
      query.push(`reviewed=${reviewed}`);
    }
    if (userId !== null) {
      query.push(`userId=${userId}`);
    }
    if (image) {
      query.push(`image=${image}`);
    }
    const response = await api.get(
      `/question?filterDeleted=${
        role !== "super"
      }&paginate=true&page=${page}&limit=${limit}${query.join("&")}`
    );
    return response?.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getSingleQuestionForReview = async (questionId) => {
  try {
    const response = await api.get(`/question/${questionId}`);
    return response?.data?.data;
  } catch (error) {
    console.log(error);

    throw error;
  }
};
