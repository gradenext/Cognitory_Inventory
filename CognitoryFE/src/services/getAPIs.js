import toast from "react-hot-toast";
import { api } from "./api";

export const getEnterprise = async (role = null) => {
  try {
    const response = await api.get(
      `/enterprise?&paginate=false&filterDeleted=${role === "super"}`
    );

    return response?.data?.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getClasses = async (enterpriseId, role = null) => {
  try {
    const response = await api.get(
      `/class?enterpriseId=${enterpriseId}&paginate=false&filterDeleted=${
        role === "super"
      }`
    );

    return response?.data?.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getSubjects = async (classId, role = null) => {
  try {
    const response = await api.get(
      `/subject?classId=${classId}&paginate=false&filterDeleted=${
        role === "super"
      }`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getTopics = async (subjectId, role = null) => {
  try {
    const response = await api.get(
      `/topic?subjectId=${subjectId}&paginate=false&filterDeleted=${
        role === "super"
      }`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getSubtopics = async (topicId, role = null) => {
  try {
    const response = await api.get(
      `/subtopic?topicId=${topicId}&paginate=false&filterDeleted=${
        role === "super"
      }`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message);
    return [];
  }
};

export const getLevels = async (subtopicId, role = null) => {
  try {
    const response = await api.get(
      `/level?subtopicId=${subtopicId}&paginate=false&filterDeleted=${
        role === "super"
      }`
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

export const getAllQuestion = async (approved = null, reviewed = null) => {
  try {
    let query = [];
    if (approved !== null) {
      query.push(`approved=${approved}`);
    }
    if (reviewed !== null) {
      query.push(`reviewed=${reviewed}`);
    }
    const response = await api.get(
      `/question?filterDeleted=true&${query.join("&")}`
    );
    return response?.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getSingleQuestionForReview = async () => {
  try {
    const response = await api.get(
      `/question/unreviewed/single?enterpriseId=${
        import.meta.env.VITE_ENTERPRISE_ID
      }`
    );
    return response?.data?.data;
  } catch (error) {
    console.log(error);

    throw error;
  }
};
