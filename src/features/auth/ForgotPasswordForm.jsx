"use client";

import React, { useState } from "react";
import { Button, Form, Input, message, Spin } from "antd";
import styles from "./PasswordForms.module.scss";
import { useRouter } from "next/navigation";
import { sendPasswordResetLink } from "@/lib/api/auth"; // Assuming this API is for sending OTP
import Logo from "@public/logo-2.png";
import Image from "next/image";
import { IoMdArrowRoundBack } from "react-icons/io";

const ForgotPasswordForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false); // State to control loading spinner
  const [messagealert, setMessageAlert] = useState(false); // State to control loading spinner

  const handleSubmit = async (values) => {
    setLoading(true); // Start loading

    const formData = { email: values?.email };
    try {
      const res = await sendPasswordResetLink(formData);
      message.success(res?.data?.message);
      setMessageAlert(true);
    } catch (e) {
      console.error("Error sending OTP:", e);
    } finally {
      setLoading(false); // Stop loading after response
    }
  };
  return (
    <div className={styles.ForgotPassword}>
      <div className={styles.Login}>
        <div className={styles.Login_inner}>
          <div className="main_heading">
            <div
              onClick={() => {
                router.push("/");
              }}
              style={{ cursor: "pointer" }}
            >
              <Image src={Logo} height={50} alt="Logo" />
            </div>
            <div
              className="innerheading"
              onClick={() => {
                router.push("/");
              }}
              style={{ cursor: "pointer" }}
            >
              <IoMdArrowRoundBack />
              <div>Go to Home</div>
            </div>
          </div>
          {messagealert ? (
            <div className="cnf_text">
              <h4>Check Your Mail</h4>
              <h6>We have sent a password recovery link to your email.</h6>
            </div>
          ) : (
            <div>
              <h4>Reset Password</h4>
              <Spin size="small" style={{ color: "white" }} spinning={loading}>
                <div>
                  <Form
                    name="basic"
                    autoComplete="off"
                    layout="vertical"
                    onFinish={handleSubmit}
                  >
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: "Please input your email!" },
                        {
                          type: "email",
                          message: "Please enter a valid email!",
                        },
                      ]}
                    >
                      <Input placeholder="example123@gmail.com" />
                    </Form.Item>
                    <Form.Item>
                      <Button
                        className="submit_btn_theme"
                        htmlType="submit"
                        block
                        loading={loading} // Display loading spinner
                      >
                        {loading ? "Sending..." : "Submit"}
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              </Spin>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ForgotPasswordForm;
