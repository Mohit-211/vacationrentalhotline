import apiHelper from "./client";
import type {
  ApiResponse,
  Id,
  Property,
  PropertyInput,
  SubscriptionStatus,
} from "./types";

export const createProperties = (formData: { properties: PropertyInput[] }) => {
  return apiHelper.post<ApiResponse<unknown>>(`property/createProperty`, formData);
};

export const getPropertiesByType = (formData: { type: SubscriptionStatus }) => {
  return apiHelper.post<ApiResponse<Property[]>>(`property/getPropertyByType`, formData);
};

export const getProperty = (id: Id) => {
  return apiHelper.get<ApiResponse<Property>>(`property/getPropertyById/${id}`);
};

export const updateProperty = (id: Id, formdata: PropertyInput) => {
  return apiHelper.put<ApiResponse<unknown>>(`property/updateProperty/${id}`, formdata);
};

export const deleteProperties = (formData: { property_ids: Id[] }) => {
  return apiHelper.post<ApiResponse<unknown>>(`property/deleteProperty`, formData);
};
