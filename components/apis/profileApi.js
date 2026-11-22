import apiHelper from "./apiHelper";

export const getProfile = () => {
  return apiHelper.get(`user/profile`);
};

export const profileUpdateAPi = (formData) => {
  return apiHelper.put("user/updateUserProfile", formData);
};
