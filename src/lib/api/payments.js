import apiHelper from "./client";

export const createPaymentIntent = (formData) => {
  return apiHelper.post(`payment/stripe/create-payment-intent`, formData);
};

export const getTotalAmount = (formdata) => {
  return apiHelper.post(`/payment/getTotalAmount`, formdata);
};
