import React from "react";
import styles from "./FooterSection.module.scss";
import logo from "../../public/assests/Logo.png";
import Image from "next/image";
import { Container } from "react-bootstrap";
import { Link as ScrollLink } from "react-scroll";
import { useRouter } from "next/router";
const FooterSection = () => {
  const router = useRouter();
  const currentyear = new Date().getFullYear();
  return (
    <div className={styles.footer}>
      <Container>
        <div className={styles.footerTop}>
          <div>
            <Image src={logo} alt="Nuclear Gauges USA" height={50} />
          </div>
          <div className={styles.fotter_item}>
            <h5>Quick Links</h5>
            <li>
              {" "}
              <ScrollLink
                to="banner-section"
                spy={true}
                smooth={true}
                offset={-70}
                duration={500}
                className={styles.link}
              >
                Home
              </ScrollLink>
            </li>
            <li>
              {" "}
              <ScrollLink
                to="about-section"
                spy={true}
                smooth={true}
                offset={-70}
                duration={500}
                className={styles.link}
              >
                About
              </ScrollLink>
            </li>
            <li>
              <ScrollLink
                to="contact-us"
                spy={true}
                smooth={true}
                offset={-70}
                duration={500}
                className={styles.link}
              >
                Contact
              </ScrollLink>
            </li>
          </div>
          <div className={styles.fotter_item}>
            <h5>Legal</h5>
            <li className={styles.link}
             onClick={() => {
              const path = "/privacy-policy";
              router.push(path);
            }}
            >Privacy Policy</li>
            <li
              className={styles.link}
              onClick={() => {
                const path = "/terms-and-conditions";
                router.push(path);
              }}
            >
              Terms and Conditions
            </li>
          </div>
          <div className={styles.fotter_item}>
            <h5>Contact Us</h5>
            <h6>Email us on</h6>
            <li className={styles.color_blue}>
              <a href="mailto:info@vacationrentalhotline.com">
                info@vacationrentalhotline.com
              </a>
            </li>
            <h6>Address</h6>

            <li className={styles.color_blue}>
              <a>1001 North Barfield Dr #98 Marco Island Florida 34145</a>
            </li>
          </div>
        </div>
      </Container>
      <hr />
      <Container>
        <div>
          <p>
            Copyright © {currentyear} Vacation Rental Hotline, All rights
            reserved.
          </p>
        </div>
      </Container>
    </div>
  );
};
export default FooterSection;
