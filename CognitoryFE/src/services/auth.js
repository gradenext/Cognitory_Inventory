import { api } from "./api";

export const signup = async (data) => {
  try {
    const response = await api.post("/user/signup", data);
    return response?.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const login = async (data) => {
  try {
    const response = await api.post("/user/login", data);
    return response?.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/user/forgot-password", { email });
    return response?.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const resetPassword = async (token, data) => {
  try {
    const response = await api.patch(`/user/reset-password/${token}`, data);
    return response?.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const changePassword = async (token, data) => {
  try {
    const response = await api.patch(`/user/change-password/${token}`, data);
    return response?.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
