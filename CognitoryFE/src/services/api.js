import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_BASE_URL,
  // baseURL: "http://localhost:5000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});
