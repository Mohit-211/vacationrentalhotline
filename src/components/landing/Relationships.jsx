import React from "react";
import styles from "./Relationships.module.scss";
import Section3image from "@public/assets/home3.png";
import Image from "next/image";
import { Container } from "react-bootstrap";

const Relationships = () => {
  return (
    <div className={styles.Section3}>
      <Container>
        <div className={styles.main}>
          <div>
            <h3>
              We have relationships with condo owners, property managers and
              owners of single family homes.
            </h3>
            <p>
              Vacation Rental Hotline is there to help owners comply with state
              laws and local ordinances that require a real live person to
              answer any neighbor calls about your property 24/7 365 days a
              year.
            </p>
          </div>
          <div className={styles.right}>
            <Image src={Section3image} alt="" className={styles.BannerImage} />
          </div>
        </div>

      </Container>
    </div>
  );
};

export default Relationships;
