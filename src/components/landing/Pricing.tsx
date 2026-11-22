import { CircleCheck, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section, SectionHeading } from "@/components/ui/Section";
import { formatPrice, PRICING } from "@/lib/pricing";
import { HOTLINE_PHONE } from "@/lib/site";
import { cn, revealOrder } from "@/lib/utils";
import PurchaseButton from "./PurchaseButton";

// Prices come from src/lib/pricing.ts, which checkout charges.
const plans = [
  {
    name: "Single Property",
    price: formatPrice(PRICING.singlePropertyCents),
    features: ["Calls answered 24/7", "365 days per year", "Text to owner if a call received"],
    badge: null,
  },
  {
    name: `2-${PRICING.maxPropertiesOnline} Properties`,
    price: formatPrice(PRICING.multiPropertyCents),
    features: [
      "Calls answered 24/7",
      "365 days per year",
      "Text to owner if a call received",
      "Email to owner / property manager",
    ],
    badge: `Save ${formatPrice(PRICING.singlePropertyCents - PRICING.multiPropertyCents)} per property`,
  },
];

const Pricing = () => {
  return (
    <Section>
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Pricing"
          title="Our Pricing Plan"
          description="We have the best plan options for your needs."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              data-reveal
              style={revealOrder(index)}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-surface p-8 shadow-sm transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl",
                plan.badge ? "border-primary-strong shadow-lg ring-1 ring-primary-strong" : "border-border"
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-8 rounded-full bg-secondary-strong px-3 py-1 text-xs font-bold text-on-strong shadow-md">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-heading text-5xl font-extrabold tracking-tight">{plan.price}</span>
                <span className="text-sm text-muted-foreground">per year, per property</span>
              </p>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <CircleCheck className="size-5 shrink-0 text-secondary-strong" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <PurchaseButton
                size="lg"
                variant={plan.badge ? "primary" : "outline"}
                className="mt-8 w-full rounded-full"
              >
                Purchase Plan
              </PurchaseButton>
            </div>
          ))}
          <div
            data-reveal
            style={revealOrder(2)}
            className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-linear-to-br from-primary-stronger via-primary-strong to-secondary-strong p-8 text-on-strong shadow-lg"
          >
            <div aria-hidden="true" className="absolute -top-16 -right-16 size-48 rounded-full bg-on-strong/10" />
            <span className="relative flex size-12 items-center justify-center rounded-2xl bg-on-strong/15 ring-1 ring-on-strong/25">
              <Phone className="size-6" aria-hidden="true" />
            </span>
            <h3 className="relative mt-6 text-lg font-bold text-on-strong">
              {PRICING.maxPropertiesOnline + 1} Properties or More
            </h3>
            <p className="relative mt-2">Please call us for pricing</p>
            <a
              href={HOTLINE_PHONE.href}
              className="relative mt-5 font-heading text-2xl font-extrabold tracking-tight whitespace-nowrap underline-offset-4 hover:underline"
            >
              {HOTLINE_PHONE.vanity}
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default Pricing;
