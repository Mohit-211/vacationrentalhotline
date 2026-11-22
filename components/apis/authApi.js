import apiHelper from "./apiHelper";
export const LoginAPi = (formData) => {
  return apiHelper.post(`user/auth/login`, formData, {
    headers: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
};
export const RegisterAPi = (formData, headers) => {
  return apiHelper.post(`user/auth/register`, formData, {
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  });
};
export const ForgotPasswordApi = (formData) => {
  return apiHelper.post(`user/auth/forgot-password`, formData);
};
export const ChangePasswordApi = (formData) => {
  return apiHelper.post(`user/auth/reset-password`, formData);
};
export const ResetPasswordApi = (formData) => {
  return apiHelper.post(`user/auth/sendResetLink`, formData);
};
export const CheckResetPasswordLink = (formData) => {
  return apiHelper.post(`user/auth/checkResetToken`, formData);
};
export const VerifyEmail = (formData) => {
  return apiHelper.post(
    `user/auth/verifyEmail
`,
    formData
  );
};
export const UpdateEmailApi = (formData) => {
  return apiHelper.post(
    `user/changeEmail
`,
    formData
  );
};

export const UpdateEmailverificationApi = (formData) => {
  return apiHelper.post(
    `user/verifyNewEmail
`,
    formData
  );
};
