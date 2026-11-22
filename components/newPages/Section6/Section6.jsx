import React from "react";
import styles from "./Section6.module.scss";
import Section6image from "../../../public/assests/section5.png";
import Image from "next/image";
import { Button, Container } from "react-bootstrap";
import { IoIosArrowForward } from "react-icons/io";
import { getLocalStorageItem } from "@/components/apis/locastorageHandle";
const Section6 = () => {
  const token = getLocalStorageItem();

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

export default Section6;
