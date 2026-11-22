"use client";

import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { quoteCheckout } from "@/lib/api/checkout";
import type { Quote } from "@/lib/api/types";
import CheckoutForm from "./CheckoutForm";

// One Stripe instance for the page, made once. Stripe's <Elements> must keep
// the instance its card field was created with; making a new one on every
// render (as the dashboard used to) breaks confirming the payment.
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface Checkout {
  propertyIds: string[];
  quote: Quote;
}

/**
 * Starting a checkout: asks the server for the price, then opens the card
 * dialog. Render <CheckoutDialog {...dialog} /> once on the page.
 */
export function useCheckout(onPaid: () => void) {
  const [checkout, setCheckout] = useState<Checkout>();
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const start = async (propertyIds: string[]) => {
    setStarting(true);
    try {
      const res = await quoteCheckout(propertyIds);
      setCheckout({ propertyIds, quote: res.data.data });
      setOpen(true);
    } catch {
      // The API client has already shown the error (e.g. too many to buy online).
    } finally {
      setStarting(false);
    }
  };

  return {
    start,
    starting,
    dialog: {
      open,
      onOpenChange: setOpen,
      checkout,
      onPaid: () => {
        setOpen(false);
        onPaid();
      },
    },
  };
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkout?: Checkout;
  onPaid: () => void;
}

/** The card form in a dialog, for the properties a checkout covers. */
export function CheckoutDialog({ open, onOpenChange, checkout, onPaid }: CheckoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Enter your card details to activate {checkout?.propertyIds.length === 1 ? "this property" : "these properties"}.
          </DialogDescription>
        </DialogHeader>
        {checkout && (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              propertyIds={checkout.propertyIds}
              quote={checkout.quote}
              onCloseModal={() => onOpenChange(false)}
              onPaymentSuccess={onPaid}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
