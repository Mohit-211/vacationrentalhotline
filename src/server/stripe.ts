import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/server/env";
import { HttpError } from "@/server/http";

let client: Stripe | undefined;

/** The Stripe client. Fails with a 503 when the server has no Stripe key. */
export function stripe(): Stripe {
  if (!client) {
    const key = serverEnv().STRIPE_SECRET_KEY;
    if (!key) {
      throw new HttpError(503, "PAYMENTS_UNAVAILABLE", "Payments aren't set up on this server yet.");
    }
    // The API version stripe-node pins; the webhook endpoint in Stripe's
    // dashboard should use the same one.
    client = new Stripe(key, { appInfo: { name: "Vacation Rental Hotline" } });
  }
  return client;
}

/**
 * The Stripe product every subscription item is a price of. Created on first
 * use with a fixed id, so no setup is needed in Stripe's dashboard.
 */
export const COVER_PRODUCT_ID = "vrh_property_cover";
let productReady: Promise<void> | undefined;

export function ensureCoverProduct(): Promise<void> {
  productReady ??= (async () => {
    try {
      await stripe().products.retrieve(COVER_PRODUCT_ID);
    } catch (error) {
      if (!(error instanceof Stripe.errors.StripeInvalidRequestError) || error.code !== "resource_missing") throw error;
      await stripe().products.create({
        id: COVER_PRODUCT_ID,
        name: "Hotline cover for one property, yearly",
        description: "Calls about the property answered 24/7, renewed every year.",
      });
    }
  })().catch((error: unknown) => {
    productReady = undefined;
    throw error;
  });
  return productReady;
}

/** Stripe timestamps are seconds since the epoch. */
export const fromUnix = (seconds: number) => new Date(seconds * 1000);
export const fromUnixOrNull = (seconds: number | null | undefined) => (seconds ? fromUnix(seconds) : null);

/** The id of an expandable Stripe field, whether it came expanded or not. */
export const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : (value?.id ?? null);
