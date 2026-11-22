"use client";

import React from "react";
import styles from "./CallCoverage.module.scss";
import Section4image from "@public/assets/section4image.png";
import Image from "next/image";
import { Button, Container } from "react-bootstrap";
import { IoIosArrowForward } from "react-icons/io";
import { getToken } from "@/lib/session";
const CallCoverage = () => {
  const token = getToken();

  return (
    <div className={styles.Section4}>
      <Container>
        <div className={styles.main}>
          <div className={styles.left}>
            <Image src={Section4image} alt="" className={styles.BannerImage} />
          </div>
          <div className={styles.right}>
            <h4>
              Vacation Rental Hotline ensures a person is there to take a call
              everyday Add we have a live representative on call 24/7 365 days a
              year. What ever time zone you are in.
            </h4>
            <Button
              className={styles.PurchaseButton}
              onClick={() =>
                token ? router.push("/dashboard") : router.push("/login")
              }
            >
              Purchase Now <IoIosArrowForward />
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CallCoverage;
