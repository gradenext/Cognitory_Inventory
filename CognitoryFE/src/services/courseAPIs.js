import { api } from "./api";
import { errorToast } from "../components/toast/Toast";

export const getCourses = async (type = null, status = null, filterDeleted = true) => {
  try {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    params.append("filterDeleted", filterDeleted);
    const response = await api.get(`/course?${params.toString()}`);
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return { courses: [], total: 0 };
  }
};

export const getCourseById = async (courseId) => {
  try {
    const response = await api.get(`/course/${courseId}`);
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return null;
  }
};

export const createCourse = async (data) => {
  try {
    const response = await api.post("/course", data);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const updateCourse = async (courseId, data) => {
  try {
    const response = await api.patch(`/course/${courseId}`, data);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const deleteCourse = async (courseId) => {
  try {
    const response = await api.delete(`/course/${courseId}`);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const publishCourse = async (courseId) => {
  try {
    const response = await api.patch(`/course/${courseId}/publish`);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const createModule = async (courseId, data) => {
  try {
    const response = await api.post(`/course/${courseId}/module`, data);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const getCourseModules = async (courseId) => {
  try {
    const response = await api.get(`/course/${courseId}/module`);
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return { modules: [], total: 0 };
  }
};

export const updateModule = async (courseId, moduleId, data) => {
  try {
    const response = await api.patch(`/course/${courseId}/module/${moduleId}`, data);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const deleteModule = async (courseId, moduleId) => {
  try {
    const response = await api.delete(`/course/${courseId}/module/${moduleId}`);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const createLesson = async (courseId, moduleId, data) => {
  try {
    const response = await api.post(`/course/${courseId}/module/${moduleId}/lesson`, data);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const getModuleLessons = async (courseId, moduleId) => {
  try {
    const response = await api.get(`/course/${courseId}/module/${moduleId}/lesson`);
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return { lessons: [], total: 0 };
  }
};

export const updateLesson = async (courseId, moduleId, lessonId, data) => {
  try {
    const response = await api.patch(
      `/course/${courseId}/module/${moduleId}/lesson/${lessonId}`,
      data
    );
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const deleteLesson = async (courseId, moduleId, lessonId) => {
  try {
    const response = await api.delete(
      `/course/${courseId}/module/${moduleId}/lesson/${lessonId}`
    );
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

// ─── Assignment APIs ──────────────────────────────────────────────────────────

export const createAssignment = async (courseId, data) => {
  try {
    const response = await api.post(`/course/${courseId}/assignment`, data);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const getCourseAssignments = async (courseId) => {
  try {
    const response = await api.get(`/course/${courseId}/assignment`);
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    return { assignments: [], total: 0 };
  }
};

export const updateAssignment = async (courseId, assignmentId, data) => {
  try {
    const response = await api.patch(`/course/${courseId}/assignment/${assignmentId}`, data);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const deleteAssignment = async (courseId, assignmentId) => {
  try {
    const response = await api.delete(`/course/${courseId}/assignment/${assignmentId}`);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const publishAssignment = async (courseId, assignmentId) => {
  try {
    const response = await api.patch(`/course/${courseId}/assignment/${assignmentId}/publish`);
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const uploadAssignmentFile = async (assignmentId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/course/assignment/${assignmentId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};

export const uploadLessonFile = async (lessonId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/course/lesson/${lessonId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response?.data;
  } catch (error) {
    console.log(error);
    errorToast(error.response?.data?.message);
    throw error;
  }
};
