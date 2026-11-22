import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { Section, SectionHeading } from "@/components/ui/Section";
import { revealOrder } from "@/lib/utils";
import PurchaseButton from "./PurchaseButton";

const card =
  "flex flex-col rounded-3xl border border-l-4 border-border border-l-secondary bg-surface p-8 shadow-sm transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg";

const About = () => {
  return (
    <Section id="about" className="bg-surface">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Who we are"
          title="About Us"
          description="We are a team of rental property owners who realize the importance of being a responsible vacation home owner. Vacation Rental Hotline works with Single Family home owners, Condo owners and Property Managers."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article data-reveal style={revealOrder(0)} className={card}>
            <Logo variant="mark" className="h-12 self-start" />
            <h3 className="mt-6 text-xl leading-snug font-bold">
              We are a company with an acute awareness of short term rentals and the issues short term rental owners
              face on a daily basis.
            </h3>
            <hr className="my-6 border-border" />
            <p className="flex-1 leading-relaxed text-muted-foreground">
              Why have that uncertainty with each rental? Have a live representative 24/7 and be a responsible renter.
            </p>
            <PurchaseButton className="mt-6 self-start rounded-full px-5">Purchase Plan</PurchaseButton>
          </article>
          <article data-reveal style={revealOrder(1)} className={card}>
            <Logo variant="mark" className="h-12 self-start" />
            <h3 className="mt-6 text-xl leading-snug font-bold">
              Getting your home management company to sign up with Vacation Rental Hotline ensures a person is there
              to take a call every day.
            </h3>
            <hr className="my-6 border-border" />
            <p className="leading-relaxed text-muted-foreground">
              By informing your neighbors with both a flyer and a visible sticker in your window, you can be a
              responsible homeowner and give them our number to call if anything is happening at your investment
              property. We then text you and e-mail you the details of the call.
            </p>
          </article>
        </div>
      </Container>
    </Section>
  );
};

export default About;
