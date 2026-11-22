import { CircleCheck, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section, SectionHeading } from "@/components/ui/Section";
import { cn } from "@/lib/utils";
import PurchaseButton from "./PurchaseButton";

const plans = [
  {
    name: "Single Property",
    price: "$250",
    features: ["Calls answered 24/7", "365 days per year", "Text to owner if a call received"],
    featured: false,
  },
  {
    name: "2-5 Properties",
    price: "$200",
    features: [
      "Calls answered 24/7",
      "365 days per year",
      "Text to owner if a call received",
      "Email to owner / property manager",
    ],
    featured: true,
  },
];

const Pricing = () => {
  return (
    <Section>
      <Container>
        <SectionHeading
          align="center"
          title="Our Pricing Plan"
          description="We have the best plan options as per your needs"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded-2xl border bg-surface p-8 shadow-sm",
                plan.featured ? "border-primary-strong shadow-lg ring-1 ring-primary-strong" : "border-border"
              )}
            >
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
              <PurchaseButton size="lg" variant={plan.featured ? "primary" : "outline"} className="mt-8 w-full">
                Purchase Plan
              </PurchaseButton>
            </div>
          ))}
          <div className="flex flex-col justify-center rounded-2xl bg-linear-to-br from-primary-strong to-primary-stronger p-8 text-on-strong shadow-lg">
            <h3 className="text-lg font-bold text-on-strong">5 Properties or More</h3>
            <p className="mt-3">Please call us for pricing</p>
            <a
              href="tel:+18446468546"
              className="mt-6 inline-flex items-center gap-3 font-heading text-2xl font-extrabold tracking-tight whitespace-nowrap underline-offset-4 hover:underline"
            >
              <Phone className="size-6 shrink-0" aria-hidden="true" />
              (844) 6-HOTLINE
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default Pricing;
