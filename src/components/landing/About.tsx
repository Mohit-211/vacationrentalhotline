"use client";

import React from "react";
import styles from "./About.module.scss";
import { Container } from "react-bootstrap";
import Image from "next/image";
import Icon from "@public/logo-1.png";
import { IoIosArrowForward } from "react-icons/io";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/session";
const About = () => {
  const router = useRouter();
  const token = getToken();
  return (
    <div id="about-section" className={styles.NewAboutUS}>
      <Container>
        <div className={styles.inner}>
          <h2>About Us</h2>
          <p className={styles.para}>
            We are a team of rental property owners who realize the importance
            of being a responsible vacation home owner. Vacation Rental Hotline
            works with Single Family home owners, Condo owners and Property
            Managers.
          </p>
          <div className={styles.firstHr}></div>
          <div className={styles.main}>
            <div className={styles.left}>
              <div className={styles.top_heading}>
                <Image src={Icon} alt="" />
                <div>
                  <h6>
                    We are a company with an acute awareness of short term
                    rentals and the issues short term rental owners face on a
                    daily basis.
                  </h6>

                  <hr />
                  <p>
                    Why have that uncertainty with each rental?. Have a live
                    representative 24/7 and be a responsible renter.
                  </p>
                  <button
                    className={styles.button}
                    onClick={() =>
                      token ? router.push("/dashboard") : router.push("/login")
                    }
                  >
                    Purchase Plan <IoIosArrowForward />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className={styles.top_heading}>
                <Image src={Icon} alt="" />
                <div>
                  <h6>
                    Getting your home management company to sign up with
                    Vacation Rental Hotline ensures a person is there to take a
                    call everyday .
                  </h6>

                  <hr />
                  <p>
                    By informing your neighbors with both a flyer and a visible
                    sticker in your window. you can be a responsible homeowner
                    and give them our number to call if anything is happening at
                    your investment property. We then text you and e-mail you
                    the details of the call.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default About;
