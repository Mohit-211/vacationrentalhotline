// Still the old API's endpoints and shapes; backend phase 2 replaces them.
import apiHelper from "./client";
import type {
  ApiResponse,
  Id,
  PaymentIntent,
  PaymentIntentInput,
  PaymentTotal,
} from "./types";

export const createPaymentIntent = (formData: PaymentIntentInput) => {
  return apiHelper.post<ApiResponse<PaymentIntent>>(
    `payment/stripe/create-payment-intent`,
    formData
  );
};

export const getTotalAmount = (formdata: { property_id: Id[] }) => {
  return apiHelper.post<ApiResponse<PaymentTotal>>(`/payment/getTotalAmount`, formdata);
};
