import axios, { type AxiosError } from "axios";
import { message } from "antd";
import { clearToken, getToken } from "@/lib/session";
import type { ApiErrorBody } from "./types";

const BASE_URL = "https://node.vacationrentalhotline.com:5000/api/v1/";

const getHeaders = (
  token: string | null,
  extraHeaders: Record<string, string | number> = {}
) => {
  const headers: Record<string, string | number> = {
    role_id: 6,
    ...extraHeaders,
  };
  if (token) {
    headers["x-access-token"] = token;
  }
  return headers;
};

const apiHelper = axios.create({
  baseURL: BASE_URL,
});

apiHelper.interceptors.request.use(
  (config) => {
    config.headers.set(getHeaders(getToken()));
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiHelper.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      const status = error.response.status;
      if (
        status === 401 ||
        error?.response?.data?.message === "Please authenticate"
      ) {
        message.error("Please Login to Continue")
        window.location.href = "/login";
        clearToken();
      } else if (
        status === 404 ||
        error?.response?.data?.message === "User Not Found"
      ) {
        message.error(error?.response?.data?.message);
        window.location.href = "/login";
        clearToken();
      } else if (status === 500 ||error?.response?.data?.message === "jwt expire" ) {
        message.error("Server error, please try again later.");
        window.location.href = "/login";
        clearToken();
      } else {
        message.error(error.response.data.message || "An error occurred.");
      }
    } else if (error.request) {
      message.error("Network error, please check your internet connection.");
    } else {
      message.error(error.message || "An unknown error occurred.");
    }
    return Promise.reject(error);
  }
);

export default apiHelper;
