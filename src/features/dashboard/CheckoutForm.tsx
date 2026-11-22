"use client";

import { useState, type FormEvent } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import { CircleAlert, CircleCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { createPaymentIntent } from "@/lib/api/payments";
import type { Id, PaymentIntentInput } from "@/lib/api/types";

// Stripe draws the card field inside its own iframe, which can't read our CSS
// variables, so these mirror the globals.css tokens (foreground,
// muted-foreground, danger).
const cardOptions: StripeCardElementOptions = {
  style: {
    base: {
      color: "#0f1b2d",
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: "16px",
      "::placeholder": { color: "#4c5869" },
    },
    invalid: { color: "#b42318", iconColor: "#b42318" },
  },
};

interface CheckoutFormProps {
  amount: number;
  currency: string;
  description?: string;
  onCloseModal: () => void;
  property_id: Id[];
  onPaymentSuccess: () => void;
}

const CheckoutForm = ({ amount, description, onCloseModal, property_id, onPaymentSuccess }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
        card: elements.getElement(CardElement)!,
      });

      if (error) {
        console.error("Payment failed:", error);
        setPaymentError(`Payment failed: ${error.message}`);
        setPaymentSuccess(null);
        setLoading(false);
        return;
      }

      const formData: PaymentIntentInput = {
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
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        console.error("check error:", result.error.message);
        setPaymentError(`Payment failed: ${result.error.message}`);
        setPaymentSuccess(null);
      } else {
        if (result.paymentIntent.status === "succeeded") {
          toast.success("Payment succeeded");
          setPaymentSuccess("Payment succeeded!");
          onCloseModal();
          onPaymentSuccess();
        }
      }
    } catch (e) {
      console.error("Error during payment process:", e);
      setPaymentError(`Payment failed: ${(e as Error).message}`);
      setPaymentSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-input bg-surface px-3 py-3 shadow-xs">
        <CardElement options={cardOptions} />
      </div>
      <Button type="submit" size="lg" disabled={!stripe || loading} className="w-full">
        <Lock aria-hidden="true" />
        {loading ? "Processing..." : `Pay $${amount / 100}`}
      </Button>
      {paymentError && (
        <Alert variant="danger">
          <CircleAlert aria-hidden="true" />
          <p>{paymentError}</p>
        </Alert>
      )}
      {paymentSuccess && (
        <Alert variant="success">
          <CircleCheck aria-hidden="true" />
          <p>{paymentSuccess}</p>
        </Alert>
      )}
    </form>
  );
};

export default CheckoutForm;
