import apiHelper from "./client";

export const getProfile = () => {
  return apiHelper.get(`user/profile`);
};

export const updateProfile = (formData) => {
  return apiHelper.put("user/updateUserProfile", formData);
};
