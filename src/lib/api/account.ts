import apiClient from "./client";
import type { Account, AccountUpdate, ApiResponse } from "./types";

export const getAccount = () => apiClient.get<ApiResponse<Account>>("/account");

/** Changes the fields sent; null or "" clears an optional one. */
export const updateAccount = (changes: AccountUpdate) => apiClient.patch<ApiResponse<Account>>("/account", changes);
