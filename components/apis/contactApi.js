import apiHelper from "./apiHelper";

export const ContactUs = (formData) => {
  return apiHelper.post(`contactUs/createContactUs`, formData);
};
