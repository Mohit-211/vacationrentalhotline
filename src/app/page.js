import Hero from "@/components/landing/Hero";
import Pricing from "@/components/landing/Pricing";
import Relationships from "@/components/landing/Relationships";
import CallCoverage from "@/components/landing/CallCoverage";
import WhatWeDo from "@/components/landing/WhatWeDo";
import MultiProperty from "@/components/landing/MultiProperty";
import About from "@/components/landing/About";
import Contact from "@/components/landing/Contact";
import CookieBanner from "@/components/layout/CookieBanner";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <div className="newLandingPage">
        <Hero id="banner-section" />
        <div className="Section">
          <Pricing />
        </div>
        <div className="Section">
          <Relationships />
        </div>
        <div className="Section">
          <CallCoverage />
        </div>
        <div className="Section">
          <WhatWeDo />
        </div>
        <div className="Section">
          <MultiProperty />
        </div>
        <div className="Section">
          <About id="about-section" />
        </div>
        <div className="Section">
          <Contact id="contact-us" />
        </div>
      </div>
      <CookieBanner />
      <Footer />
    </>
  );
}
