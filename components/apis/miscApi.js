import apiHelper from "./apiHelper";

export const GetCountryCode = () => {
  return apiHelper.get(`country?limit=300&page=1`);
};

export const GetStatesByCountry = (countryId) => {
  return apiHelper.get(`country/${countryId}`);
};

export const GetCitiesByState = (stateId) => {
  return apiHelper.get(`city/${stateId}`);
};
