import apiHelper from "./client";
import type {
  ApiResponse,
  ChangePasswordInput,
  LoginInput,
  LoginResult,
  RegisterInput,
  ResetPasswordInput,
  TokenInput,
} from "./types";

export const login = (formData: LoginInput) => {
  return apiHelper.post<ApiResponse<LoginResult>>(`user/auth/login`, formData, {
    headers: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
};
export const register = (
  formData: RegisterInput,
  headers?: Record<string, string>
) => {
  return apiHelper.post<ApiResponse<unknown>>(`user/auth/register`, formData, {
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  });
};
export const resetPassword = (formData: ResetPasswordInput) => {
  return apiHelper.post<ApiResponse<unknown>>(`user/auth/forgot-password`, formData);
};
export const changePassword = (formData: ChangePasswordInput) => {
  return apiHelper.post<ApiResponse<unknown>>(`user/auth/reset-password`, formData);
};
export const sendPasswordResetLink = (formData: { email: string }) => {
  return apiHelper.post<ApiResponse<unknown>>(`user/auth/sendResetLink`, formData);
};
export const checkResetToken = (formData: TokenInput) => {
  return apiHelper.post<ApiResponse<unknown>>(`user/auth/checkResetToken`, formData);
};
export const verifyEmail = (formData: TokenInput) => {
  return apiHelper.post<ApiResponse<unknown>>(
    `user/auth/verifyEmail
`,
    formData
  );
};
export const requestEmailChange = (formData: { newEmail: string }) => {
  return apiHelper.post<ApiResponse<unknown>>(
    `user/changeEmail
`,
    formData
  );
};

export const verifyNewEmail = (formData: TokenInput) => {
  return apiHelper.post<ApiResponse<unknown>>(
    `user/verifyNewEmail
`,
    formData
  );
};
