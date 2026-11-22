"use client";

import { useState, type FormEvent } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import { CircleAlert, Lock } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { startCheckout, syncCheckout } from "@/lib/api/checkout";
import type { Quote } from "@/lib/api/types";
import { formatPrice } from "@/lib/pricing";

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
  propertyIds: string[];
  /** The price the server quoted for these properties. */
  quote: Quote;
  onCloseModal: () => void;
  onPaymentSuccess: () => void;
}

/**
 * Takes the card and pays for the first year. The server sets the price and
 * starts the subscription; Stripe.js confirms the payment in the browser.
 */
const CheckoutForm = ({ propertyIds, quote, onCloseModal, onPaymentSuccess }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const card = elements?.getElement(CardElement);
    if (!stripe || !card) return;

    setLoading(true);
    setPaymentError(null);
    try {
      const { data } = await startCheckout(propertyIds);
      const result = await stripe.confirmCardPayment(data.data.clientSecret, { payment_method: { card } });
      if (result.error) {
        setPaymentError(`Payment failed: ${result.error.message}`);
        return;
      }
      if (result.paymentIntent?.status === "succeeded") {
        // Activate now rather than waiting for Stripe's webhook.
        await syncCheckout(data.data.subscriptionId).catch(() => undefined);
        toast.success("Payment succeeded");
        onCloseModal();
        onPaymentSuccess();
      }
    } catch {
      // The API client has already shown the error.
    } finally {
      setLoading(false);
    }
  };

  return (
    <form method="post" onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-input bg-surface px-3 py-3 shadow-xs">
        <CardElement options={cardOptions} />
      </div>
      <p className="text-sm text-muted-foreground">
        {quote.propertyCount === 1 ? "1 property" : `${quote.propertyCount} properties`} at{" "}
        {formatPrice(quote.unitAmountCents)} per year each. Renews automatically every year; you can cancel the renewal
        from the property at any time.
      </p>
      <Button type="submit" size="lg" disabled={!stripe} loading={loading} className="w-full">
        <Lock aria-hidden="true" />
        {loading ? "Processing..." : `Pay ${formatPrice(quote.totalCents)}`}
      </Button>
      {paymentError && (
        <Alert variant="danger">
          <CircleAlert aria-hidden="true" />
          <p>{paymentError}</p>
        </Alert>
      )}
    </form>
  );
};

export default CheckoutForm;
