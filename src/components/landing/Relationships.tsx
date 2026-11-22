import Image from "next/image";
import beachHouse from "@public/assets/beach-house.png";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

/** Two opposite corners rounded wide, the other two only slightly: a leaf. */
const leaf = "rounded-tl-[5rem] rounded-tr-2xl rounded-br-[5rem] rounded-bl-2xl";

const Relationships = () => {
  return (
    <Section className="bg-primary-soft">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div data-reveal>
          <p className="mb-3 text-sm font-semibold tracking-wider text-primary-strong uppercase">Who we work with</p>
          <h2 className="text-3xl leading-tight font-bold sm:text-4xl">
            We have relationships with condo owners, property managers and owners of single family homes.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Vacation Rental Hotline is there to help owners comply with state laws and local ordinances that require a
            real live person to answer any neighbor calls about your property 24/7 365 days a year.
          </p>
        </div>
        {/* Narrower on phones, so the offset outline stays inside the screen. */}
        <div data-reveal className="relative mx-auto w-[calc(100%-0.75rem)] max-w-lg sm:w-full">
          <div
            aria-hidden="true"
            className={`absolute inset-0 translate-x-3 translate-y-3 border-2 border-primary sm:translate-x-4 sm:translate-y-4 ${leaf}`}
          />
          <Image
            src={beachHouse}
            alt="A white beach house among palm trees"
            sizes="(min-width: 1024px) 32rem, 92vw"
            className={`relative aspect-[3/2] w-full object-cover shadow-xl ${leaf}`}
          />
        </div>
      </Container>
    </Section>
  );
};

export default Relationships;
