import Image from "next/image";
import { CalendarCheck, Clock, Globe } from "lucide-react";
import service247 from "@public/assets/service-24-7.png";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { revealOrder } from "@/lib/utils";
import PurchaseButton from "./PurchaseButton";

const facts = [
  { icon: Clock, label: "24/7 live answering" },
  { icon: CalendarCheck, label: "365 days a year" },
  { icon: Globe, label: "Any time zone" },
];

const CallCoverage = () => {
  return (
    <Section>
      <Container>
        <div
          data-reveal
          className="relative grid items-center gap-10 overflow-hidden rounded-[2.5rem] bg-linear-to-br from-primary-stronger via-primary-strong to-secondary-strong p-8 shadow-xl sm:p-12 lg:grid-cols-[2fr_3fr] lg:gap-14 lg:p-16"
        >
          <div aria-hidden="true" className="absolute -top-24 -left-24 size-72 rounded-full bg-on-strong/10" />
          <div aria-hidden="true" className="absolute -right-20 -bottom-28 size-80 rounded-full bg-secondary/25 blur-2xl" />
          {/* The graphic brings its own white frame; it just tilts, and straightens on hover. */}
          <Image
            src={service247}
            alt="24/7 service"
            sizes="(min-width: 1024px) 20rem, 60vw"
            className="relative mx-auto w-full max-w-[16rem] -rotate-3 rounded-[1.75rem] shadow-xl transition-transform duration-500 hover:rotate-0 lg:max-w-xs"
          />
          <div className="relative">
            <p className="font-heading text-xl leading-snug font-bold text-on-strong sm:text-2xl lg:text-[1.7rem]">
              Vacation Rental Hotline ensures a person is there to take a call every day, and we have a live
              representative on call 24/7 365 days a year, whatever time zone you are in.
            </p>
            <ul className="mt-8 flex flex-wrap gap-3">
              {facts.map(({ icon: Icon, label }, index) => (
                <li
                  key={label}
                  data-reveal
                  style={revealOrder(index + 1)}
                  className="flex items-center gap-2 rounded-full bg-primary-stronger/40 px-4 py-2 text-sm font-semibold text-on-strong ring-1 ring-on-strong/25"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <PurchaseButton size="lg" variant="inverse" className="mt-8 rounded-full px-7 shadow-lg">
              Purchase Now
            </PurchaseButton>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default CallCoverage;
