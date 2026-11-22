import apiClient from "./client";
import type { ApiResponse, Note } from "./types";

export const addNote = (propertyId: string, body: string) =>
  apiClient.post<ApiResponse<Note>>(`/properties/${propertyId}/notes`, { body });

export const updateNote = (propertyId: string, noteId: string, body: string) =>
  apiClient.patch<ApiResponse<Note>>(`/properties/${propertyId}/notes/${noteId}`, { body });

export const deleteNote = (propertyId: string, noteId: string) =>
  apiClient.delete(`/properties/${propertyId}/notes/${noteId}`);
