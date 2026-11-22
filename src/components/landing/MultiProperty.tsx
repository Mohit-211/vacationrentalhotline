import Image from "next/image";
import { Phone } from "lucide-react";
import agentOnPhone from "@public/assets/agent-on-phone.png";
import { Container } from "@/components/ui/Container";
import { HOTLINE_PHONE } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import PurchaseButton from "./PurchaseButton";

const MultiProperty = () => {
  return (
    <Section>
      <Container className="grid items-center gap-14 lg:grid-cols-[2fr_3fr]">
        {/* Narrower on phones, so the tilted backdrop stays inside the screen. */}
        <div data-reveal className="relative mx-auto w-[calc(100%-1.5rem)] max-w-sm sm:w-full">
          <div
            aria-hidden="true"
            className="absolute -inset-2 rotate-2 rounded-[2.5rem] bg-linear-to-br from-primary to-secondary opacity-20 sm:-inset-3"
          />
          <Image
            src={agentOnPhone}
            alt="A hotline representative talking on the phone"
            sizes="(min-width: 1024px) 24rem, 80vw"
            className="relative w-full rounded-[2rem] shadow-xl"
          />
        </div>
        <div data-reveal>
          <p className="font-heading text-2xl leading-snug font-bold sm:text-3xl">
            Vacation Rental Hotline ensures a live representative is available for your property 365 days of the year
            24/7.
          </p>
          <p className="mt-6 text-lg text-muted-foreground">For listing multiple properties over 5 please call</p>
          <a
            href={HOTLINE_PHONE.href}
            className="group mt-3 inline-flex items-center gap-3 font-heading text-3xl font-extrabold tracking-tight text-primary-strong transition-colors hover:text-primary-stronger"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft transition-colors group-hover:bg-primary/15">
              <Phone className="size-6" aria-hidden="true" />
            </span>
            {HOTLINE_PHONE.display}
          </a>
          <div>
            <PurchaseButton size="lg" className="mt-8 rounded-full px-7">
              Purchase Now
            </PurchaseButton>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default MultiProperty;
