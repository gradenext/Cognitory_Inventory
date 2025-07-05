import axios from "axios";


export const api = axios.create({
  baseURL: "https://cognitory.onrender.com/api/v1",
});

api.interceptors.request.use((config) => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODYxMGMxZmZmMTgwYWQxMzRjNDM1YTUiLCJlbWFpbCI6ImRldmd1cHRhQGdtYWlsLmNvbSIsInJvbGUiOiJzdXBlciIsImlhdCI6MTc1MTE5MDk2OX0.7P7l1wBfzEvUHHINUjbzNLLgFCBvdz-R_Sjm0_FpDjA";

  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});