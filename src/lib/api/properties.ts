import apiClient from "./client";
import type { ApiResponse, Property, PropertyInput, PropertyStatus, PropertyWithNotes } from "./types";

export const listProperties = (status?: PropertyStatus) =>
  apiClient.get<ApiResponse<Property[]>>("/properties", { params: status ? { status } : undefined });

export const getProperty = (id: string) => apiClient.get<ApiResponse<PropertyWithNotes>>(`/properties/${id}`);

/** Adds 1 to 500 properties; all are saved, or none. */
export const createProperties = (properties: PropertyInput[]) =>
  apiClient.post<ApiResponse<Property[]>>("/properties", { properties });

export const updateProperty = (id: string, changes: Partial<PropertyInput>) =>
  apiClient.patch<ApiResponse<Property>>(`/properties/${id}`, changes);

export const deleteProperties = (ids: string[]) =>
  apiClient.delete<ApiResponse<{ deleted: number }>>("/properties", { data: { ids } });
