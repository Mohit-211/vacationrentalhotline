import React, { useState } from "react";
import styles from "./NewContact.module.scss";
import { Container } from "react-bootstrap";
import { Form, Input, message, Button } from "antd";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import ContactImage from "../../../public/assests/contactus.png";
import Image from "next/image";
import { ContactUs } from "@/components/apis/contactApi";
const NewContact = () => {
  const [form] = Form.useForm();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const onFinish = (values) => {
    setLoading(true);
    const updatedValues = { ...values, contact_number: phoneNumber };
    ContactUs(updatedValues)
      .then((res) => {
        message.success("Your query has been submitted.");
        form.resetFields();
        setPhoneNumber("");
      })
      .catch((e) => {
        console.log(e, "Error");
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const validatePhoneNumber = (rule, value) => {
    if (!value) {
      return Promise.reject("Phone number is required.");
    }
    const phoneNumber = parsePhoneNumberFromString(value);
    if (phoneNumber && phoneNumber.isValid()) {
      return Promise.resolve();
    }
    return Promise.reject("Invalid phone number.");
  };
  return (
    <div id="contact-us" className={`${styles?.NewContact} NewContact`}>
      <Container>
        <div className={styles?.inner}>
          <h4>Contact Us</h4>
          <div className={styles.main}>
            <div className={styles.left}>
              <Form
                name="basic"
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
              >
                <Form.Item
                  label="Your Name"
                  name="name"
                  rules={[
                    {
                      required: true,
                      message: "Please input your name!",
                    },
                  ]}
                >
                  <Input
                    placeholder="Your Name"
                    className={styles.custminput}
                  />
                </Form.Item>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Please input your email!",
                      type: "email",
                    },
                  ]}
                >
                  <Input
                    placeholder="Your Email"
                    className={styles.custminput}
                  />
                </Form.Item>
                <Form.Item
                  label="Mobile Number"
                  name="contact_number"
                  rules={[
                    {
                      required: true,
                      message: "Please input your mobile number!",
                    },
                    {
                      validator: validatePhoneNumber,
                    },
                  ]}
                >
                  <PhoneInput
                    placeholder="Enter Mobile Number"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    defaultCountry="US"
                    className={styles.custminput}
                  />
                </Form.Item>
                <Form.Item
                  label="Message"
                  name="requirements"
                  rules={[
                    {
                      required: true,
                      message: "Please input your message!",
                    },
                  ]}
                >
                  <Input placeholder="Message" className={styles.custminput} />
                </Form.Item>
                <Form.Item>
                  <Button
                    htmlType="submit"
                    className={styles.button}
                    loading={loading}
                  >
                    Submit
                  </Button>
                </Form.Item>
              </Form>
            </div>
            <div className={styles.right}>
              <Image src={ContactImage} alt="Contact Us" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
export default NewContact;
