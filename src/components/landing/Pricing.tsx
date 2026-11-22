"use client";

import React from "react";
import styles from "./Pricing.module.scss";
import { Container } from "react-bootstrap";
import { FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/session";
const Pricing = () => {
  const router = useRouter();
  const token = getToken();

  return (
    <section className={styles.plansContainer}>
      <div className={styles.plans}>
        <Container>
          <div className={styles.plansHero}>
            <h2>Our Pricing Plan</h2>
            <p className={styles.para}>
              We have the best plan options as per your needs
            </p>
          </div>
          <div className={styles.planItemContainer}>
            <div className={styles.planItem}>
              <div className={styles.cardHeader}>
                <h6>Single Property</h6>
              </div>
              <ul className={styles.featureList}>
                <li>
                  <FaCheckCircle size={20} className={styles.svgicon} />
                  <span>Calls answered 24/7</span>
                </li>
                <li>
                  <FaCheckCircle size={20} className={styles.svgicon} />
                  <span>365 days per year.</span>
                </li>
                <li>
                  <FaCheckCircle size={20} className={styles.svgicon} />
                  <span>Text to owner if a call received</span>
                </li>
                <h4>$250</h4>
                <p>per year-per property.</p>
              </ul>
              <button
                className={styles.button}
                onClick={() =>
                  token ? router.push("/dashboard") : router.push("/login")
                }
              >
                Purchase Plan
              </button>
            </div>
            <div className={styles.planItem}>
              <div className={styles.cardHeader}>
                <h6>2-5 Properties</h6>
              </div>
              <ul className={styles.featureList}>
                <li>
                  <FaCheckCircle size={20} className={styles.svgicon} />
                  <span>Calls answered 24/7</span>
                </li>
                <li>
                  <FaCheckCircle size={20} className={styles.svgicon} />
                  <span>365 days per year.</span>
                </li>
                <li>
                  <FaCheckCircle size={20} className={styles.svgicon} />
                  <span>Text to owner if a call received</span>
                </li>
                <li>
                  <FaCheckCircle size={20} className={styles.svgicon} />
                  <span>Email to owner /property manager.</span>
                </li>
                <h4>$200</h4>
                <p>per year-per property.</p>
              </ul>
              <button
                className={styles.button}
                onClick={() =>
                  token ? router.push("/dashboard") : router.push("/login")
                }
              >
                Purchase Plan
              </button>
            </div>
            <div className={styles.planItem1}>
              <div className={styles.card}>
                <div>
                  <h5>5 Properties or More</h5>
                  <small style={{ color: "black" }}>
                    Please call us for pricing
                  </small>
                  <h3>(844) 6-HOTLINE</h3>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
};
export default Pricing;
