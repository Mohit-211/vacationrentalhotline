import apiHelper from "./apiHelper";

export const stripePaymentApi = (formData) => {
  return apiHelper.post(`payment/stripe/create-payment-intent`, formData);
};

export const GetAmountTotal = (formdata) => {
  return apiHelper.post(`/payment/getTotalAmount`, formdata);
};
