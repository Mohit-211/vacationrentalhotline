"use client";

import React from "react";
import styles from "./MultiProperty.module.scss";
import Section6image from "@public/assets/section5.png";
import Image from "next/image";
import { Button, Container } from "react-bootstrap";
import { IoIosArrowForward } from "react-icons/io";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/session";
const MultiProperty = () => {
  const router = useRouter();
  const token = getToken();

  return (
    <div className={styles.Section6}>
      <Container>
        <div className={styles.main}>
          <div className={styles.left}>
            <Image src={Section6image} alt="" className={styles.BannerImage} />
          </div>
          <div className={styles.right}>
            <h5>
              Vacation Rental Hotline ensures a live representative is available
              for your property 365 days of the year 24/7.
            </h5>
            <h5> For listing multiple properties over 5 please call on</h5>
            <h5 className={styles.call}>(844) 646-8546</h5>
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

export default MultiProperty;
