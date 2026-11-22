import axios, { type AxiosError } from "axios";
import { toast } from "sonner";
import type { ApiErrorBody } from "./types";

// Calls this site's own API under /api. The session cookie goes along
// automatically; it's httpOnly, so no script can read it.
const apiClient = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      // The session ended (signed out elsewhere, or expired).
      toast.error("Please Login to Continue");
      // A full page load, since this runs outside React.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    } else if (error.response) {
      toast.error(error.response.data?.error?.message ?? "Something went wrong. Please try again.");
    } else if (error.request) {
      toast.error("Network error, please check your internet connection.");
    } else {
      toast.error(error.message || "An unknown error occurred.");
    }
    return Promise.reject(error);
  },
);

export default apiClient;
