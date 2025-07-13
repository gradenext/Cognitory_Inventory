import { api } from "./api";

export const deleteQuestion = async (questionId) => {
  try {
    const response = await api.delete(`/question/${questionId}`);
    return response?.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};
