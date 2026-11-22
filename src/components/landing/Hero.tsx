import Image from "next/image";
import { Check, Phone } from "lucide-react";
import heroHouse from "@public/assets/hero-house.png";
import { Container } from "@/components/ui/Container";
import PurchaseButton from "./PurchaseButton";

const highlights = ["Calls answered 24/7", "Text to owner if a call received", "Email to owner / property manager"];

const Hero = () => {
  return (
    <section id="home" className="relative overflow-hidden bg-linear-to-b from-primary-soft to-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 -right-40 size-[36rem] rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 size-[30rem] rounded-full bg-secondary/10 blur-3xl"
      />
      <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div>
          <h1 className="text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl">
            Vacation Rental Hotline is available to take calls{" "}
            <span className="text-primary-strong">24/7 365 days a year</span> by a live representative
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            As short term responsible rental property owners ourselves we are acutely aware of how important it is to
            be compliant with local ordinances and State rules. We can make sure you are notified quickly with any
            problems or issues. We will help you be a responsible renter.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <PurchaseButton size="lg">Purchase Now</PurchaseButton>
            <a
              href="tel:+18446468546"
              className="inline-flex items-center gap-2 rounded-md font-semibold text-primary-strong transition-colors hover:text-primary-stronger"
            >
              <Phone className="size-4" aria-hidden="true" />
              (844) 646-8546
            </a>
          </div>
          <ul className="mt-10 grid gap-3 text-sm font-medium sm:grid-cols-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary-soft text-secondary-strong">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-x-4 top-10 bottom-0 rounded-[2.5rem] bg-surface/80 shadow-xl ring-1 ring-border sm:inset-x-10"
          />
          <Image
            src={heroHouse}
            alt=""
            priority
            sizes="(min-width: 1024px) 34rem, 90vw"
            className="relative mx-auto w-full max-w-xl"
          />
        </div>
      </Container>
    </section>
  );
};

export default Hero;
