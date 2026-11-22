import Image from "next/image";
import service247 from "@public/assets/service-24-7.png";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import PurchaseButton from "./PurchaseButton";

const CallCoverage = () => {
  return (
    <Section className="bg-linear-to-br from-primary-strong to-primary-stronger">
      <Container className="grid items-center gap-12 lg:grid-cols-[2fr_3fr]">
        <Image
          src={service247}
          alt=""
          sizes="(min-width: 1024px) 24rem, 80vw"
          className="mx-auto w-full max-w-sm rounded-3xl shadow-xl"
        />
        <div>
          <h2 className="text-3xl leading-tight font-bold text-on-strong sm:text-4xl">
            Vacation Rental Hotline ensures a person is there to take a call every day, and we have a live
            representative on call 24/7 365 days a year, whatever time zone you are in.
          </h2>
          <PurchaseButton size="lg" variant="inverse" className="mt-8">
            Purchase Now
          </PurchaseButton>
        </div>
      </Container>
    </Section>
  );
};

export default CallCoverage;
