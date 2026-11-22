import Image from "next/image";
import { BellRing, FileText, MoonStar, PhoneCall, ShieldCheck } from "lucide-react";
import servicesCollage from "@public/assets/services-collage.png";
import { Container } from "@/components/ui/Container";
import { Section, SectionHeading } from "@/components/ui/Section";
import { revealOrder } from "@/lib/utils";

const points = [
  {
    icon: ShieldCheck,
    text: "Most ordinances and new laws being passed today involving Short Term Rentals - or STR homes require a 24/7 number for contact purposes. Vacation Rental Hotline IS THAT NUMBER.",
  },
  {
    icon: PhoneCall,
    text: "We are on call 24/7 to assist in taking calls from neighbors regarding your rental. Is someone having a party? Has the trash can been left out? Is a car parked on the front yard?",
  },
  {
    icon: FileText,
    text: "Give your neighbors the downloadable PDF and put our sticker in your window so your neighbors know who to call.",
  },
  {
    icon: BellRing,
    text: "Instantly we will text you that you have a party in your house and we will email you. Don't wait for a code notice that arrives in 4 weeks! Sign up today and we will tell you instantly what is going on in your property.",
  },
  {
    icon: MoonStar,
    text: "Do you want to be woken up by a neighbor at 3 am - let the Vacation Rental Hotline answer those calls. Property managers - we can help you also!! Let us be the “on call” person 24/7 for a low fee!!",
  },
];

const WhatWeDo = () => {
  return (
    <Section className="bg-surface">
      <Container className="grid gap-12 lg:grid-cols-[3fr_2fr] lg:gap-16">
        <div>
          <SectionHeading eyebrow="How it works" title="What We Do" />
          <ul className="mt-8 space-y-4">
            {points.map(({ icon: Icon, text }, index) => (
              <li
                key={text}
                data-reveal
                style={revealOrder(index % 2)}
                className="flex gap-4 rounded-2xl border border-border bg-canvas p-5 transition-colors duration-300 hover:border-primary/40"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-strong to-secondary-strong text-on-strong shadow-sm">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <p className="leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
        {/* Stays in view beside the long list on wide screens. */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Image
            src={servicesCollage}
            alt="Collage of vacation rental homes, a hand holding house keys, and a hotline representative wearing a headset"
            sizes="(min-width: 1024px) 28rem, 80vw"
            data-reveal
            className="mx-auto w-full max-w-xs sm:max-w-sm lg:mt-20 lg:max-w-md"
          />
        </div>
      </Container>
    </Section>
  );
};

export default WhatWeDo;
