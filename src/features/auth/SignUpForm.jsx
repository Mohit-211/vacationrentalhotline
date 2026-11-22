"use client";

import React, { useState } from "react";
import { Button, Form, Input, Checkbox } from "antd";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api/auth";
import styles from "./SignUpForm.module.scss"; // Assuming you're using a separate CSS module for styles
import StatusMessage from "@/components/ui/StatusMessage";

const SignUpForm = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [storeEmail, setStoreEmail] = useState();
  const [messageAlert, setMessageAlert] = useState(false);
  const termsAccepted = Form.useWatch("terms", form);

  const handleSubmit = async (values) => {
    
    setLoading(true);
    const updatedValues = { ...values, mobile: phoneNumber };
    try {
      await register(updatedValues);
      // Reset the form and show success message
      form.resetFields();

      setStoreEmail(values?.email);
      setMessageAlert(true); // Set message alert state to true
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (value) => {
    setPhoneNumber(value);
  };

  const validatePhoneNumber = (rule, value) => {
    if (!value) {
      return Promise.reject("Phone number is required");
    }
    const phoneNumber = parsePhoneNumberFromString(value);
    if (phoneNumber && phoneNumber.isValid()) {
      return Promise.resolve();
    }
    return Promise.reject("Invalid phone number.");
  };
  const emailText = `We've sent a verification link to the email address you provided: <strong>${storeEmail}</strong>. Please click the link in the email to verify your email address and complete the sign-up process. If the email address above is incorrect, please Sign Up Again to create a new account with the correct email.`;
  return (
    <>
      {messageAlert ? (
        <div>
          <StatusMessage
            subject="Almost there! Verify Your Email"
            text={emailText}
            buttonText="Create New Account"
            onButtonClick={() => setMessageAlert(false)}
            useHtmlText={true} // New prop to indicate HTML rendering
          />
         
        </div>
      ) : (
        <div className={styles.Signup}>
          <div className={styles.Signup_inner}>
            <div>
              <h4>Create an Account</h4>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[
                    { required: true, message: "Please input your name!" },
                  ]}
                >
                  <Input placeholder="Enter Name" />
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
                  <Input placeholder="Enter Email" />
                </Form.Item>

                <Form.Item
                  label="Mobile"
                  name="mobile"
                  rules={[
                    { required: true, message: "Please input your mobile!" },
                    { validator: validatePhoneNumber },
                  ]}
                >
                  <PhoneInput
                    placeholder="Enter Mobile Number"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    defaultCountry="US"
                    countries={["US", "CA"]}
                    inputClass="custom-phone-input"
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Please input your password!" },
                    {
                      min: 8,
                      message: "Password must be at least 8 characters long!",
                    },
                    {
                      pattern: /^(?=\D*\d)(?=[^ ]+$).{8,}$/,
                      message:
                        "Password must have at least 2 digits and no blank space!",
                    },
                  ]}
                  hasFeedback
                >
                  <Input.Password placeholder="*****" />
                </Form.Item>

                <Form.Item
                  label="Confirm Password"
                  name="confirm_password"
                  dependencies={["password"]}
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: "Please confirm your password!",
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("The two passwords do not match!")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="*****" />
                </Form.Item>

                <Form.Item
                  name="terms"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(
                              "Should accept terms and conditions"
                            ),
                    },
                  ]}
                >
                  <Checkbox>
                    I have read the{" "}
                    <a
                      href="/terms-and-conditions"
                      style={{ textDecoration: "underline", color: "blue" }}
                    >
                      terms and conditions
                    </a>
                  </Checkbox>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="submit_btn_theme"
                    loading={loading}
                    disabled={!termsAccepted}
                  >
                    Create Account
                  </Button>
                </Form.Item>
              </Form>

              <div className={styles?.bottomText}>
                Already have an account?{" "}
                <span
                  onClick={() => {
                    router.push("/login");
                  }}
                  style={{ cursor: "pointer", color: "blue" }}
                >
                  Login
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignUpForm;
