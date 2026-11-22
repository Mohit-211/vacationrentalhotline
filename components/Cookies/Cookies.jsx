import React, { useState, useEffect } from "react";
import { hasCookie, setCookie } from "cookies-next";
import styles from "./CookieBanner.module.scss"; 
import Link from "next/link";

const CookieBanner = () => {
  const [showConsent, setShowConsent] = useState(true);

  useEffect(() => {
    setShowConsent(!hasCookie("Vacation Rental Cookies"));
  }, []);

  const acceptCookies = () => {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    setCookie("Vacation Rental Cookies", true, { expires: expiryDate });
    setShowConsent(false);
  };

  const declineCookies = () => {
    setShowConsent(false);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className={styles.cookiesBox}>
      <p className={styles.cookiesText}>
        We use cookies to personalise content and ads, to provide social media
        features, and to analyse our traffic. We also share information about
        your use of our site with our social media, advertising, and analytics
        partners who may combine it with other information that you’ve provided
        to them or that they’ve collected from your use of their services.
        <Link className={styles.cookiesLink} href="/cookies-policy ">
          Read More
        </Link>
      </p>
      <div className={styles.cookiesButtons}>
        <button
          className={`${styles.cookiesBtn} ${styles.cookiesBtnAccept}`}
          onClick={acceptCookies}
        >
          Allow
        </button>
        <button
          className={`${styles.cookiesBtn} ${styles.cookiesBtnDecline}`}
          onClick={declineCookies}
        >
          Deny
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
