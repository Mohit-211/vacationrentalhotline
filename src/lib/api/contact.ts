import apiHelper from "./client";
import type { ApiResponse, ContactInput } from "./types";

export const submitContactForm = (formData: ContactInput) => {
  return apiHelper.post<ApiResponse<unknown>>(`contactUs/createContactUs`, formData);
};
