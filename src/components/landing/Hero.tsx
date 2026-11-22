import Image from "next/image";
import { Check, Phone } from "lucide-react";
import heroHouse from "@public/assets/hero-house.png";
import { Container } from "@/components/ui/Container";
import { HOTLINE_PHONE } from "@/lib/site";
import PurchaseButton from "./PurchaseButton";

const highlights = ["Calls answered 24/7", "Text to owner if a call received", "Email to owner / property manager"];

const Hero = () => {
  return (
    // Runs up behind the floating header. On wide screens it is one screen
    // tall (within limits), so the headline, the buttons and the whole house
    // show without scrolling. Clipped sideways only as a guard: the house is
    // sized to stay inside the window.
    <section
      id="home"
      className="relative -mt-header flex flex-col overflow-x-clip pt-header lg:h-svh lg:max-h-[56rem] lg:min-h-[36rem]"
    >
      {/* The gradient stops short of the bottom, so the house sits on its edge. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 bottom-10 overflow-hidden rounded-b-[2.5rem] bg-linear-to-br from-primary-stronger via-primary-strong to-secondary-strong sm:rounded-b-none sm:rounded-bl-[7rem] lg:bottom-14"
      >
        <div className="absolute -top-40 right-0 size-[34rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -right-24 -bottom-48 size-[30rem] rounded-full bg-secondary/25 blur-3xl" />
      </div>

      <Container className="relative grid flex-1 gap-y-6 pt-4 sm:gap-y-8 sm:pt-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-x-12 lg:pt-0">
        <div className="lg:pb-14">
          {/* On wide screens the size follows the window's height, so short laptop screens keep some air. */}
          <h1 className="text-[1.75rem] leading-[1.15] font-extrabold tracking-tight text-balance text-on-strong sm:text-[2.6rem] lg:text-[clamp(2.25rem,1rem+3.2vh,2.75rem)]">
            Vacation Rental Hotline is available to take calls{" "}
            {/* A marker stroke under the words, not a box around them. */}
            <span className="bg-linear-to-t from-secondary/90 from-25% to-transparent to-25% box-decoration-clone">
              24/7 365 days a year
            </span>{" "}
            by a live representative
          </h1>
          {/* On phones the headline and buttons come first; About and the price cards say the rest. */}
          <p className="mt-5 hidden max-w-xl leading-relaxed text-on-strong sm:block sm:text-[1.0625rem] lg:text-base">
            As short term responsible rental property owners ourselves we are acutely aware of how important it is to
            be compliant with local ordinances and State rules. We can make sure you are notified quickly with any
            problems or issues. We will help you be a responsible renter.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-7">
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
          <ul className="mt-7 hidden flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-on-strong sm:flex">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 shrink-0" strokeWidth={3} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* The house: as wide as its column, but never taller than the screen
            leaves room for (1.46 = the picture's width / height). On wide
            screens it may also take part of the page margin (--bleed), always
            stopping short of the window's edge. */}
        <div className="relative mx-auto w-[min(100%,28rem,calc(26svh*1.46))] self-end sm:w-[min(100%,32rem,calc(32svh*1.46))] lg:mr-[calc(var(--bleed)*-1)] lg:w-[min(calc(100%_+_var(--bleed)),44rem,calc((min(100svh,56rem)_-_16rem)*1.46))] lg:justify-self-end lg:[--bleed:max(1rem,calc((100vw_-_72rem)/4_+_1rem))]">
          <div
            aria-hidden="true"
            className="absolute inset-x-[12%] bottom-[6%] h-[12%] rounded-[50%] bg-foreground/30 blur-2xl"
          />
          <Image
            src={heroHouse}
            alt=""
            priority
            sizes="(min-width: 1024px) 36rem, (min-width: 640px) 32rem, 90vw"
            className="relative w-full animate-float drop-shadow-float"
          />
        </div>
      </Container>
    </section>
  );
};

export default Hero;
