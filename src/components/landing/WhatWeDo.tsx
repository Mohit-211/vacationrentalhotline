import Image from "next/image";
import { BellRing, FileText, MoonStar, PhoneCall, ShieldCheck } from "lucide-react";
import Section5image from "@public/assets/whatwedo.png";
import { Container } from "@/components/ui/Container";
import { Section, SectionHeading } from "@/components/ui/Section";

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
    <Section>
      <Container className="grid items-center gap-12 lg:grid-cols-[3fr_2fr]">
        <div>
          <SectionHeading title="What We Do" />
          <ul className="mt-8 space-y-5">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <p className="leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
        <Image
          src={Section5image}
          alt="Collage of vacation rental homes, a hand holding house keys, and a hotline representative wearing a headset"
          sizes="(min-width: 1024px) 28rem, 90vw"
          className="mx-auto w-full max-w-md"
        />
      </Container>
    </Section>
  );
};

export default WhatWeDo;
