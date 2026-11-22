import Image from "next/image";
import Section3image from "@public/assets/home3.png";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

const Relationships = () => {
  return (
    <Section className="bg-surface">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl leading-tight font-bold sm:text-4xl">
            We have relationships with condo owners, property managers and owners of single family homes.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Vacation Rental Hotline is there to help owners comply with state laws and local ordinances that require a
            real live person to answer any neighbor calls about your property 24/7 365 days a year.
          </p>
        </div>
        <Image src={Section3image} alt="" sizes="(min-width: 1024px) 34rem, 90vw" className="mx-auto w-full max-w-lg" />
      </Container>
    </Section>
  );
};

export default Relationships;
