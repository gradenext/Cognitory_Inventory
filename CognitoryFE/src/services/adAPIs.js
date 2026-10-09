import { api } from "./api";
import { errorToast } from "../components/toast/Toast";

const run = async (request, fallback) => {
  try {
    const response = await request();
    return response?.data?.data;
  } catch (error) {
    console.log(error);
    errorToast(error?.response?.data?.message || "Something went wrong");
    if (fallback !== undefined) return fallback;
    throw error;
  }
};

export const getAds = (params = {}) => run(() => api.get("/ad", { params }), { ads: [], total: 0 });
export const createAd = (data) => run(() => api.post("/ad", data));
export const updateAd = (adId, data) => run(() => api.patch(`/ad/${adId}`, data));
export const uploadAdMedia = (adId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return run(() => api.post(`/ad/${adId}/media`, formData));
};
export const removeAdMedia = (adId) => run(() => api.delete(`/ad/${adId}/media`));
export const publishAd = (adId) => run(() => api.patch(`/ad/${adId}/publish`));
export const pauseAd = (adId) => run(() => api.patch(`/ad/${adId}/pause`));
export const deleteAd = (adId) => run(() => api.delete(`/ad/${adId}`));
