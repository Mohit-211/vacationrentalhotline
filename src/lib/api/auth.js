import apiHelper from "./client";
export const login = (formData) => {
  return apiHelper.post(`user/auth/login`, formData, {
    headers: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
};
export const register = (formData, headers) => {
  return apiHelper.post(`user/auth/register`, formData, {
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  });
};
export const resetPassword = (formData) => {
  return apiHelper.post(`user/auth/forgot-password`, formData);
};
export const changePassword = (formData) => {
  return apiHelper.post(`user/auth/reset-password`, formData);
};
export const sendPasswordResetLink = (formData) => {
  return apiHelper.post(`user/auth/sendResetLink`, formData);
};
export const checkResetToken = (formData) => {
  return apiHelper.post(`user/auth/checkResetToken`, formData);
};
export const verifyEmail = (formData) => {
  return apiHelper.post(
    `user/auth/verifyEmail
`,
    formData
  );
};
export const requestEmailChange = (formData) => {
  return apiHelper.post(
    `user/changeEmail
`,
    formData
  );
};

export const verifyNewEmail = (formData) => {
  return apiHelper.post(
    `user/verifyNewEmail
`,
    formData
  );
};
