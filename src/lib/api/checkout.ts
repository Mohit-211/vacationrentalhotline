import apiClient from "./client";
import type { ApiResponse, Property, Quote, StartedCheckout } from "./types";

/** The yearly price of covering these properties (the server sets it). */
export const quoteCheckout = (propertyIds: string[]) =>
  apiClient.post<ApiResponse<Quote>>("/checkout/quote", { propertyIds });

/** Starts the yearly subscription; returns the client secret to confirm the first payment. */
export const startCheckout = (propertyIds: string[]) =>
  apiClient.post<ApiResponse<StartedCheckout>>("/checkout", { propertyIds });

/** After the payment: applies it right away instead of waiting for Stripe's webhook. */
export const syncCheckout = (subscriptionId: string) =>
  apiClient.post<ApiResponse<Property[]>>(`/checkout/${subscriptionId}/sync`);

/** Stops a property renewing; it stays covered until its paid year ends. */
export const cancelRenewal = (propertyId: string) =>
  apiClient.post<ApiResponse<Property>>(`/properties/${propertyId}/cancel-renewal`);
