"use client";

import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import styles from "./CheckoutForm.module.scss";
import { Button } from "react-bootstrap";
import { message } from "antd";
import { createPaymentIntent } from "@/lib/api/payments";

const CheckoutForm = ({
  amount,
  currency,
  description,
  onCloseModal,
  property_id,
  onPaymentSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      console.error("Stripe.js has not loaded yet.");
      return;
    }

    setLoading(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const { error } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
      });

      if (error) {
        console.error("Payment failed:", error);
        setPaymentError(`Payment failed: ${error.message}`);
        setPaymentSuccess(null);
        setLoading(false);
        return;
      }

      const formData = {
        paymentMethod: "card",
        amount: amount,
        currency: "USD",
        property_id: property_id,
        description: description || "",
      };
      const response = await createPaymentIntent(formData);
      const clientSecret = response.data?.data?.clientSecret;
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        console.error("check error:", result.error.message);
        setPaymentError(`Payment failed: ${result.error.message}`);
        setPaymentSuccess(null);
      } else {
        if (result.paymentIntent.status === "succeeded") {
          message.success("Payment succeeded");
          setPaymentSuccess("Payment succeeded!");
          onCloseModal();
          onPaymentSuccess(); // Call the success callback
        }
      }
    } catch (e) {
      console.error("Error during payment process:", e);
      setPaymentError(`Payment failed: ${e.message}`);
      setPaymentSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.checkoutFormContainer}>
      <form onSubmit={handleSubmit} className={styles.checkoutForm}>
        <CardElement className={styles.cardElement} />
        <Button
          type="submit"
          disabled={!stripe || loading}
          className={styles.Login}
        >
          {loading ? "Processing..." : `Pay $${amount / 100}`}
        </Button>
        {paymentError && <p className={styles.errorMessage}>{paymentError}</p>}
        {paymentSuccess && (
          <p className={styles.successMessage}>{paymentSuccess}</p>
        )}
      </form>
    </div>
  );
};

export default CheckoutForm;
