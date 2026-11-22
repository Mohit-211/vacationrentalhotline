import NewBannerSection from "@/components/newPages/NewBannerSection/NewBannerSection";
import PricingSection from "@/components/PricingSection/PricingSection";
import Section3 from "@/components/newPages/Section3/Section3";
import Section4 from "@/components/newPages/Section4/Section4";
import Section5 from "@/components/newPages/Section5/Section5";
import Section6 from "@/components/newPages/Section6/Section6";
import NewAboutUS from "@/components/newPages/NewAboutUS/NewAboutUS";
import NewContact from "@/components/newPages/NewContact/NewContact";

export default function Home() {
  return (
    <div className="newLandingPage">
      <NewBannerSection id="banner-section" />
      <div className="Section">
        <PricingSection />
      </div>
      <div className="Section">
        <Section3 />
      </div>
      <div className="Section">
        <Section4 />
      </div>
      <div className="Section">
        <Section5 />
      </div>
      <div className="Section">
        <Section6 />
      </div>
      <div className="Section">
        <NewAboutUS id="about-section" />
      </div>
      <div className="Section">
        <NewContact id="contact-us" />
      </div>
    </div>
  );
}
