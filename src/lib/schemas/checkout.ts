import { z } from "zod";

/** The properties to buy cover for, in one checkout. */
export const checkoutSchema = z.object({
  propertyIds: z.array(z.uuid("Invalid property id.")).min(1, "Choose at least one property.").max(50),
});

export interface CheckoutInput {
  propertyIds: string[];
}
