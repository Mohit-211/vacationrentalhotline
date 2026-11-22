import React from "react";
import styles from "./NewBannerSection.module.scss";
import { Button, Container } from "react-bootstrap";
import BannerHomeImage from "../../../public/assests/BannerHomeImage.png";
import Image from "next/image";
import { IoIosArrowForward } from "react-icons/io";
import HeadersSection from "../../HeadersSection/HeadersSection";
import { useRouter } from "next/router";
import { getLocalStorageItem } from "@/components/apis/locastorageHandle";
const NewBannerSection = () => {
  const router = useRouter();
  const token = getLocalStorageItem();

  return (
    <div className={styles.NewBannerSection}>
      <div className={styles?.bannerInner}>
        <Container>

          <HeadersSection />
          <div className={styles.main}>
            <div className={styles.left}>
              <h1>
                Vacation Rental Hotline is available to take calls 24/7 365 days
                a year by a live representative
              </h1>
              <p>
                As short term responsible rental property owners ourselves we
                are acutely aware of how important it is to be compliant with
                local ordinances and State rules. We can make sure you are
                notified quickly with any problems or issues. We will help you
                be a responsible renter .
              </p>
              <Button
                className={styles.PurchaseButton}
                onClick={() =>
                  token ? router.push("/dashboard") : router.push("/login")
                }
              >
                Purchase Now <IoIosArrowForward />
              </Button>
            </div>
            <div className={styles.right}>
              <Image
                src={BannerHomeImage}
                alt=""
                className={styles.BannerImage}
              />
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default NewBannerSection;
