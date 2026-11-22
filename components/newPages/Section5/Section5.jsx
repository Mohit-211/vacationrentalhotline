import React from "react";
import styles from "./Section5.module.scss";
import Section5image from "../../../public/assests/whatwedo.png";
import Image from "next/image";
import { Container } from "react-bootstrap";
const Section5 = () => {
  return (
    <div className={styles.Section5}>
      <Container>
        <div className={styles.main}>
          <div>
            <h4>What We do</h4>
            <ul>
              <li>
                Most ordinances and new laws being passed today involving Short
                Term Rentals - or STR homes require a 24/7 number for contact
                purposes.Vacation Rental Hotline IS THAT NUMBER.
              </li>
              <li>
                We are on call 24/7 to assist in taking calls from neighbors
                regarding your rental. Is someone having a party? Has the trash
                can been left out? Is a car parked on the front yard?
              </li>
              <li>
                Give your neighbors the downloadable PDF and put our sticker in
                your window so your neighbors know who to call.
              </li>
              <li>
                Instantly we will text you that you have a party in your house
                and we will email you. Dont wait for a code notice that arrives
                in 4 weeks! Sign up today and we will tell you instantly what is
                going on in your property.
              </li>
              <li>
                Do you want to be woken up by a neighbor at 3 am - let the
                Vacation rental Hotline answer those calls.Property managers -
                we can help you also !! Let us be the “on call” person 24/7 for
                a low fee!!
              </li>
            </ul>
          </div>
          <div>
            <Image src={Section5image} />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Section5;
