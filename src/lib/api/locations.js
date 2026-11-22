import apiHelper from "./client";

export const getCountries = () => {
  return apiHelper.get(`country?limit=300&page=1`);
};

export const getStates = (countryId) => {
  return apiHelper.get(`country/${countryId}`);
};

export const getCities = (stateId) => {
  return apiHelper.get(`city/${stateId}`);
};
