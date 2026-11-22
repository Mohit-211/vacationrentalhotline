import apiHelper from "./client";

export const createProperties = (formData) => {
  return apiHelper.post(`property/createProperty`, formData);
};

export const getPropertiesByType = (formData) => {
  return apiHelper.post(`property/getPropertyByType`, formData);
};

export const getProperty = (id) => {
  return apiHelper.get(`property/getPropertyById/${id}`);
};

export const updateProperty = (id, formdata) => {
  return apiHelper.put(`property/updateProperty/${id}`, formdata);
};

export const deleteProperties = (formData) => {
  return apiHelper.post(`property/deleteProperty`, formData);
};
