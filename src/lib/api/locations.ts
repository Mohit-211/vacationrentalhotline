import apiHelper from "./client";
import type { ApiResponse, City, Country, CountryWithStates, Id } from "./types";

export const getCountries = () => {
  return apiHelper.get<ApiResponse<Country[]>>(`country?limit=300&page=1`);
};

export const getStates = (countryId: Id) => {
  return apiHelper.get<ApiResponse<CountryWithStates[]>>(`country/${countryId}`);
};

export const getCities = (stateId: Id) => {
  return apiHelper.get<ApiResponse<City[]>>(`city/${stateId}`);
};
