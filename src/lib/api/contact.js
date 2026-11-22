import apiHelper from "./client";

export const submitContactForm = (formData) => {
  return apiHelper.post(`contactUs/createContactUs`, formData);
};
