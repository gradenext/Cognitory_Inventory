import { api } from "./api";

export const makeAdmin = async (userId) => {
  try {
    const response = await api.patch(`/user/promote/${userId}`);
    return response?.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const demoteAdmin = async (userId) => {
  try {
    const response = await api.patch(`/user/demote/${userId}`);
    return response?.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const toggleApprove = async (userId) => {
  try {
    const response = await api.patch(`/user/approve/${userId}`);
    return response?.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const getAllUsers = async () => {
  try {
    const response = await api.get(`/user`);
    return response?.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
