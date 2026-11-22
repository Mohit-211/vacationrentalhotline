import apiHelper from "./client";
import type { ApiResponse, UpdateProfileInput, UserProfile } from "./types";

export const getProfile = () => {
  return apiHelper.get<ApiResponse<UserProfile>>(`user/profile`);
};

export const updateProfile = (formData: UpdateProfileInput) => {
  return apiHelper.put<ApiResponse<unknown>>("user/updateUserProfile", formData);
};
