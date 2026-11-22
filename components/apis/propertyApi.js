import apiHelper from "./apiHelper";

export const AddNewPropertyApi = (formData) => {
  return apiHelper.post(`property/createProperty`, formData);
};

export const GetPropertyApi = (formData) => {
  return apiHelper.post(`property/getPropertyByType`, formData);
};

export const GetPropertyDetailApi = (id) => {
  return apiHelper.get(`property/getPropertyById/${id}`);
};

export const EditPropertyApi = (id, formdata) => {
  return apiHelper.put(`property/updateProperty/${id}`, formdata);
};

export const DeletePropertyApi = (formData) => {
  return apiHelper.post(`property/deleteProperty`, formData);
};
