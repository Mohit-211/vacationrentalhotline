import Image from "next/image";
import { Phone } from "lucide-react";
import agentOnPhone from "@public/assets/agent-on-phone.png";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import PurchaseButton from "./PurchaseButton";

const MultiProperty = () => {
  return (
    <Section className="bg-surface">
      <Container className="grid items-center gap-12 lg:grid-cols-[2fr_3fr]">
        <Image src={agentOnPhone} alt="" sizes="(min-width: 1024px) 24rem, 80vw" className="mx-auto w-full max-w-sm" />
        <div>
          <h2 className="text-3xl leading-tight font-bold sm:text-4xl">
            Vacation Rental Hotline ensures a live representative is available for your property 365 days of the year
            24/7.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">For listing multiple properties over 5 please call</p>
          <a
            href="tel:+18446468546"
            className="mt-2 inline-flex items-center gap-3 font-heading text-3xl font-extrabold tracking-tight text-primary-strong transition-colors hover:text-primary-stronger"
          >
            <Phone className="size-7" aria-hidden="true" />
            (844) 646-8546
          </a>
          <div>
            <PurchaseButton size="lg" className="mt-8">
              Purchase Now
            </PurchaseButton>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default MultiProperty;
