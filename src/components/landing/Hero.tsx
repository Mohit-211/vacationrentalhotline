import Image from "next/image";
import { Check, Phone } from "lucide-react";
import heroHouse from "@public/assets/hero-house.png";
import { Container } from "@/components/ui/Container";
import { HOTLINE_PHONE } from "@/lib/site";
import PurchaseButton from "./PurchaseButton";

const highlights = ["Calls answered 24/7", "Text to owner if a call received", "Email to owner / property manager"];

const Hero = () => {
  return (
    // Runs up behind the floating header, so the gradient fills the top of the page.
    // Clipped sideways only, so the house can spill down but never widen the page.
    <section id="home" className="relative -mt-header overflow-x-clip pt-header">
      {/* The gradient, with one large rounded corner. The house sits on top and spills past its edge. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] bg-linear-to-br from-primary-stronger via-primary-strong to-secondary-strong sm:rounded-b-none sm:rounded-bl-[7rem]"
      >
        <div className="absolute -top-40 right-0 size-[34rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -right-24 -bottom-48 size-[30rem] rounded-full bg-secondary/25 blur-3xl" />
      </div>

      <Container className="relative grid gap-y-12 pt-10 sm:pt-14 lg:grid-cols-[1.25fr_1fr] lg:gap-x-6 lg:pt-16">
        <div className="lg:pb-24">
          <h1 className="text-4xl leading-[1.12] font-extrabold tracking-tight text-on-strong sm:text-5xl lg:text-[2.7rem] xl:text-[2.9rem]">
            Vacation Rental Hotline is available to take calls{" "}
            <span className="rounded-lg bg-on-strong/15 box-decoration-clone px-1.5 sm:whitespace-nowrap">
              24/7 365 days a year
            </span>{" "}
            by a live representative
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-strong">
            As short term responsible rental property owners ourselves we are acutely aware of how important it is to
            be compliant with local ordinances and State rules. We can make sure you are notified quickly with any
            problems or issues. We will help you be a responsible renter.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <PurchaseButton size="lg" variant="inverse" className="rounded-full px-7 shadow-lg">
              Purchase Now
            </PurchaseButton>
            <a
              href={HOTLINE_PHONE.href}
              className="group inline-flex items-center gap-3 rounded-full font-semibold text-on-strong"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-on-strong/15 ring-1 ring-on-strong/30 transition-colors group-hover:bg-on-strong/25">
                <Phone className="size-4" aria-hidden="true" />
              </span>
              <span className="underline-offset-4 group-hover:underline">{HOTLINE_PHONE.display}</span>
            </a>
          </div>
          <ul className="mt-9 flex flex-wrap gap-2.5 text-sm font-medium text-on-strong">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-full bg-primary-stronger/40 py-1.5 pr-3.5 pl-2 ring-1 ring-on-strong/25"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-on-strong text-secondary-strong">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* The house sits on the hero's bottom edge and spills past it. */}
        <div className="relative -mb-16 self-end sm:-mb-24 lg:-mr-6 lg:-mb-40 xl:-mr-12">
          <div
            aria-hidden="true"
            className="absolute inset-x-[12%] bottom-[6%] h-[12%] rounded-[50%] bg-foreground/30 blur-2xl"
          />
          <Image
            src={heroHouse}
            alt=""
            priority
            sizes="(min-width: 1024px) 40rem, 92vw"
            className="relative mx-auto w-full max-w-2xl animate-float drop-shadow-float lg:w-[110%] lg:max-w-none"
          />
          {/* A floating status card above the roof, bobbing out of step with the house. */}
          <div className="absolute -top-2 left-2 flex animate-float items-center gap-3 rounded-2xl bg-surface/90 px-4 py-3 shadow-xl backdrop-blur-md [animation-delay:-3.5s] sm:-top-6 lg:-top-14 lg:left-4">
            <span className="relative flex size-3">
              <span className="absolute inset-0 animate-ping rounded-full bg-secondary opacity-60" />
              <span className="relative size-3 rounded-full bg-secondary" />
            </span>
            <span>
              <span className="block text-sm font-bold">Live representative</span>
              <span className="block text-xs text-muted-foreground">Answering calls 24/7</span>
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
