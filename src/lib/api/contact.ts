import apiClient from "./client";
import type { ApiResponse, ContactMessageInput } from "./types";

export const sendContactMessage = (message: ContactMessageInput) =>
  apiClient.post<ApiResponse<{ id: string }>>("/contact-messages", message);
